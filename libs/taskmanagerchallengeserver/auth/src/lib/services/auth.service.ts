import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/sign-up.dto';
import { UsersService } from '@task-manager-nx-workspace/api/users/lib/services/users.service';
import { AuthResponse } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/auth-response.interface';
import { JwtPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/jwt-payload.interface';
import { UserData } from '@task-manager-nx-workspace/api/shared/lib/interfaces/users/user-data.interface';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { RolesService } from '@task-manager-nx-workspace/api/roles/lib/services/roles.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly envService: EnvironmentService,
  ) { }

  private async getTokens(userId: number, email: string, permissions: string[]): Promise<{ accessToken: string, refreshToken: string }> {
    const payload: JwtPayload = { userId, email, permissions };

    try {
      const accessToken = this.jwtService.sign(payload); // Uses default sign options configured in AuthModule

      const refreshToken = this.jwtService.sign(payload, {
        secret: this.envService.getJwtRefreshSecret(),
        expiresIn: this.envService.getJwtRefreshExpiration(),
      });

      await this.usersService.storeRefreshToken(userId, refreshToken);

      return { accessToken, refreshToken };

    } catch (error) {
      console.error('Token generation error:', error);
      throw new InternalServerErrorException('Failed to generate authentication tokens.');
    }
  }

  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    const { email, password } = signUpDto;

    const userExists = await this.usersService.findUserByEmail(email);
    if (userExists) {
      throw new ConflictException('User with this email already exists.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await this.usersService.createUser({ email, passwordHash, roleName: 'viewer' });

    const permissions = await this.rolesService.getPermissionsByRoleName('viewer');

    return this.getTokens(newUser.userId, newUser.email, permissions);
  }

  async logIn(user: UserData): Promise<AuthResponse> {
    const permissions = await this.rolesService.getPermissionsByUserId(user.userId);

    return this.getTokens(user.userId, user.email, permissions);
  }

  async refreshTokens(userId: number, oldRefreshToken: string): Promise<AuthResponse> {
    const isTokenValidAndRevoked = await this.usersService.revokeAndVerifyRefreshToken(userId, oldRefreshToken);
    if (!isTokenValidAndRevoked) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.usersService.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const permissions = await this.rolesService.getPermissionsByUserId(userId);

    return this.getTokens(user.userId, user.email, permissions);
  }
}
