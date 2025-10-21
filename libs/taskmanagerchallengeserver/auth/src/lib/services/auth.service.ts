import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@task-manager-nx-workspace/api/users/lib/services/users.service';
import { RolesService } from '@task-manager-nx-workspace/api/roles/lib/services/roles.service';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { UserData } from '@task-manager-nx-workspace/api/shared/lib/interfaces/users/user-data.interface';
import { JwtPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/jwt-payload.interface';
import { TokenResponseDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/token-response.dto';
import { LogInDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/log-in.dto';
import { TokenRefreshDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/token-refresh.dto';

interface UserProfileForTokens {
  userId: number;
  email: string;
  roles: { roleName: string }[];
  permissions: string[];
}

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_BYTES = 32;

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
        } as UserData;
      }
    }
    return null;
  }

  private async getTokens(userData: UserData): Promise<TokenResponseDto> {
    const { userId } = userData;
    const userProfile = await this.usersService.findProfileById(userId) as UserProfileForTokens | null;

    if (!userProfile) {
      throw new UnauthorizedException('User profile not found. Account may be inactive or deleted.');
    }

    const accessPayload: JwtPayload = {
      userId: userProfile.userId,
      email: userProfile.email,
      roles: userProfile.roles.map(r => r.roleName),
      permissions: userProfile.permissions,
    };

    const accessToken = this.jwtService.sign(accessPayload);

    const refreshToken = crypto.randomBytes(this.REFRESH_TOKEN_BYTES).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const expiresInStr = this.envService.get<string>('JWT_REFRESH_EXPIRATION');
    const expirationMs = this.rolesService.getRefreshTokenExpirationMilliseconds(expiresInStr);
    const expiresAt = new Date(Date.now() + expirationMs);

    await this.usersService.saveRefreshToken(userId, refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresAt.getTime(),
      userId: userId,
    } as TokenResponseDto;
  }

  async signUp(signUpData: LogInDto): Promise<TokenResponseDto> {
    const userExists = await this.usersService.userExistsByEmail(signUpData.email);

    if (userExists) {
      throw new BadRequestException('User with this email already exists.');
    }

    const newUser = await this.usersService.create(signUpData);

    return this.getTokens(newUser);
  }

  async login(userData: UserData): Promise<TokenResponseDto> {
    return this.getTokens(userData);
  }

  async refreshToken(refreshTokenRequest: TokenRefreshDto): Promise<TokenResponseDto> {
    const { refreshToken } = refreshTokenRequest;

    const incomingTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenRecord = await this.usersService.findRefreshTokenByHash(incomingTokenHash);

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
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

  async logout(refreshTokenRequest: TokenRefreshDto): Promise<void> {
    const { refreshToken } = refreshTokenRequest;
    const incomingTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const tokenRecord = await this.usersService.findRefreshTokenByHash(incomingTokenHash);

    if (tokenRecord) {
      await this.usersService.revokeRefreshToken(tokenRecord.tokenId);
    }
  }
}
