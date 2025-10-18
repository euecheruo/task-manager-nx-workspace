import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@task-manager-nx-workspace/api/users/lib/services/users.service';
import { RolesService } from '@task-manager-nx-workspace/api/roles/lib/services/roles.service';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { SignUpDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/sign-up.dto';
import { UserData } from '@task-manager-nx-workspace/api/shared/lib/interfaces/users/user-data.interface';
import { JwtPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/jwt-payload.interface';
import { TokenResponseDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/token-response.dto';
import { TokenRefreshDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/token-refresh.dto';

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_BYTES = 32; // 256-bit token for security

  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private jwtService: JwtService,
    private envService: EnvironmentService,
  ) { }

  async validateUser(email: string, password: string): Promise<UserData | null> {
    const user = await this.usersService.findUserByEmailWithHash(email);

    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);

      if (isMatch) {
        return {
          userId: user.userId,
          email: user.email,
          createdAt: user.createdAt,
        };
      }
    }
    return null;
  }

  private async getTokens(userData: any): Promise<any> { // Using 'any' for brevity, replace with DTO/Interface
    const { userId } = userData;
    const userProfile = await this.usersService.findProfileById(userId);

    const accessPayload: JwtPayload = { // Replace with actual JwtPayload fields
      userId: userProfile.userId,
      email: userProfile.email,
      roles: userProfile.roles,
      permissions: userProfile.permissions,
    };

    // FIX: Remove manual secret and expiresIn options. 
    // This allows jwtService.sign(payload) to use the default options 
    // set up in the JwtModule (via jwtAccessConfigFactory), fixing the overload error.
    const accessToken = this.jwtService.sign(accessPayload);

    // 3. Create, Hash, and Store Refresh Token
    const refreshToken = crypto.randomBytes(this.REFRESH_TOKEN_BYTES).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Use fixed RolesService function to parse expiration string (e.g., '30d')
    const expiresInStr = this.envService.get<string>('JWT_REFRESH_EXPIRATION');
    const expirationMs = this.rolesService.getRefreshTokenExpirationMilliseconds(expiresInStr);
    const expiresAt = new Date(Date.now() + expirationMs);

    await this.usersService.saveRefreshToken(userId, refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresAt.getTime(),
      userId: userId,
    };
  }

  async signUp(signUpDto: SignUpDto): Promise<TokenResponseDto> {
    const newUser = await this.usersService.create(signUpDto);

    return this.getTokens(newUser);
  }

  async login(userData: UserData): Promise<TokenResponseDto> {
    return this.getTokens(userData);
  }

  async refreshToken(refreshTokenDto: TokenRefreshDto): Promise<TokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    const incomingTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const tokenRecord = await this.usersService.findRefreshTokenByHash(incomingTokenHash);

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid, revoked, or expired refresh token.');
    }

    await this.usersService.revokeRefreshToken(tokenRecord.tokenId);

    const newTokens = await this.getTokens({
      userId: tokenRecord.userId,
      email: tokenRecord.user.email,
      createdAt: tokenRecord.user.createdAt,
    });

    return newTokens;
  }

  async logout(refreshTokenDto: TokenRefreshDto): Promise<void> {
    const { refreshToken } = refreshTokenDto;
    const incomingTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const tokenRecord = await this.usersService.findRefreshTokenByHash(incomingTokenHash);

    if (tokenRecord) {
      await this.usersService.revokeRefreshToken(tokenRecord.tokenId);
    }
  }
}
