import { Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../../users/src/lib/services/users.service';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { TokenResponseDto } from '../dtos/token-response.dto'; // Import DTO
import { convertTimeStringToSeconds } from '../strategies/jwt.utils'; // Corrected relative path

interface UserDetails {
  userId: number;
  email: string;
  passwordHash: string;
}

interface UserProfileData {
  userId: number;
  email: string;
}

interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TokenPayload {
  userId: number;
  email: string;
  permissions: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private refreshTokensRepository: RefreshTokensRepository,
  ) { }

  /**
   * Helper method to sign JWTs with standard claims (sub, aud, iss) and configuration.
   * The expiresIn parameter is expected to be the duration in seconds (number).
   * Note: This method is used by generateTokens and accepts the specific secret key required.
   */
  private async jwtServiceSignAsync<T>(
    userId: number,
    expiresIn: number,
    secretKey: string,
    payload?: T,
  ): Promise<string> {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.configService.get<string>('JWT_TOKEN_AUDIENCE'),
        issuer: this.configService.get<string>('JWT_TOKEN_ISSUER'),
        secret: secretKey,
        expiresIn,
      },
    );
  }

  /**
   * Validates user credentials (email and password). Used by LocalStrategy.
   * @throws UnauthorizedException if credentials are invalid.
   * @returns Minimal user object (userId, email) on success.
   */
  async validateUserCredentials(email: string, pass: string): Promise<UserProfileData> {
    this.logger.debug(`Attempting credential validation for email: ${email}`);

    const user: UserDetails | null = await this.usersService.getByEmail(email);

    if (!user || !(await bcrypt.compare(pass, user.passwordHash))) {
      this.logger.warn(`Failed credential validation for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials.');
    }

    return {
      userId: user.userId,
      email: user.email,
    };
  }

  /**
   * Validates user credentials, generates JWT pair (Access & Refresh),
   * and securely stores the refresh token hash for session management.
   * Returns the complete TokenResponseDto structure.
   */
  async login(email: string, pass: string): Promise<TokenResponseDto> {
    const user: UserDetails | null = await this.usersService.getByEmail(email);

    if (!user || !(await bcrypt.compare(pass, user.passwordHash))) {
      this.logger.warn(`Failed login attempt for email: ${email}`);
      throw new UnauthorizedException('Invalid credentials.');
    }

    const permissions: string = await this.usersService.getPermissionsForUser(user.userId);

    const newTokens: GeneratedTokens = await this.generateTokens(
      user.userId,
      user.email,
      permissions,
    );

    const refreshExpirationString = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    const refreshExpirationSeconds = convertTimeStringToSeconds(refreshExpirationString);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshExpirationSeconds);

    await this.refreshTokensRepository.createToken(
      user.userId,
      newTokens.refreshToken,
      expiresAt,
    );
    this.logger.log(`User ${user.userId} logged in successfully and refresh token stored.`);

    return {
      tokenType: 'Bearer',
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn,
    };
  }

  /**
   * Generates a new pair of Access and Refresh tokens, and returns the access token's expiration.
   * Access Token contains the comprehensive list of user permissions for RBAC checks.
   */
  private async generateTokens(
    userId: number,
    email: string,
    permissions: string,
  ): Promise<GeneratedTokens> {
    const accessPayload: TokenPayload = { userId, email, permissions };
    const refreshPayload = { email };

    const accessExpirationString = this.configService.get<string>('JWT_ACCESS_EXPIRATION') as string;
    const refreshExpirationString = this.configService.get<string>('JWT_REFRESH_EXPIRATION') as string;

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') as string;
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') as string;

    const accessExpiration = convertTimeStringToSeconds(accessExpirationString);
    const refreshExpiration = convertTimeStringToSeconds(refreshExpirationString);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtServiceSignAsync(userId, accessExpiration, accessSecret, accessPayload),
      this.jwtServiceSignAsync(userId, refreshExpiration, refreshSecret, refreshPayload),
    ]);

    return { accessToken, refreshToken, expiresIn: accessExpiration };
  }

  /**
   * Validates the old refresh token, revokes it, and issues a new token pair (rotation).
   */
  async refreshTokens(
    userId: number,
    currentRefreshToken: string,
  ): Promise<TokenResponseDto> {
    const isValidToken: boolean = await this.refreshTokensRepository.validateAndRevokeToken(
      userId,
      currentRefreshToken,
    );
    if (!isValidToken) {
      this.logger.warn(
        `Refresh token validation failed for user ${userId}. Token may be expired or revoked.`,
      );
      throw new ForbiddenException('Invalid or revoked refresh token.');
    }

    const user: UserProfileData | null = await this.usersService.getById(userId);
    if (!user) {
      this.logger.error(
        `User profile not found during token refresh for user ID ${userId}.`,
      );
      throw new UnauthorizedException('User profile not found.');
    }
    const permissions: string = await this.usersService.getPermissionsForUser(user.userId);

    const newTokens: GeneratedTokens = await this.generateTokens(
      user.userId,
      user.email,
      permissions,
    );

    const refreshExpirationString = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    const refreshExpirationSeconds = convertTimeStringToSeconds(refreshExpirationString);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshExpirationSeconds);

    await this.refreshTokensRepository.createToken(
      userId,
      newTokens.refreshToken,
      expiresAt,
    );
    this.logger.log(`User ${userId} successfully rotated refresh token.`);

    return {
      tokenType: 'Bearer',
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn,
    };
  }

  /**
   * Revokes the user's persistent session by invalidating their refresh token(s).
   */
  async logout(userId: number): Promise<void> {
    await this.refreshTokensRepository.revokeAllTokensForUser(userId);
    this.logger.log(`User ${userId} successfully logged out and all refresh tokens revoked.`);
  }
}
