import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/user.repository';
import { UserRoleRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/user-role.repository';
import { RefreshTokenRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/refresh-token.repository';
import { RoleRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/role.repository';
import { UserEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/user.entity';
import { RefreshTokenEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/refresh-token.entity';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { LogInDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/log-in.dto';
import { UserData } from '@task-manager-nx-workspace/api/shared/lib/interfaces/users/user-data.interface';
import { UserUpdateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-update.dto';
import { UserRequestPayload } from '@task-manager-nx-workspace/api/shared/lib//interfaces/auth/user-request-payload.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly BCRYPT_SALT_ROUNDS: number;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly roleRepository: RoleRepository,
    private readonly envService: EnvironmentService,
  ) {
    this.BCRYPT_SALT_ROUNDS = this.envService.get<number>('BCRYPT_SALT_ROUNDS');
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    return this.userRepository.userExistsByEmail(email);
  }

  async findUserByEmailWithHash(email: string): Promise<UserEntity | null> {
    return this.userRepository.findUserByEmailWithPassword(email);
  }

  async create(userData: LogInDto): Promise<UserData> {
    const passwordHash = await bcrypt.hash(userData.password, this.BCRYPT_SALT_ROUNDS);

    const newUser = await this.userRepository.createUser({
      email: userData.email,
      passwordHash,
    });

    const defaultRole = await this.roleRepository.findOneByName('editor');
    if (!defaultRole) {
      this.logger.error('Default role "editor" not found. Check initial seed data.', 'UsersService.create');
      throw new InternalServerErrorException('Account created but role assignment failed. Contact admin.');
    }

    await this.userRoleRepository.assignRoleToUser(newUser.userId, defaultRole.roleId);

    return {
      userId: newUser.userId,
      email: newUser.email,
      createdAt: newUser.createdAt,
    } as UserData;
  }

  async findProfileById(userId: number): Promise<UserRequestPayload | null> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      return null;
    }

    const permissions = await this.userRoleRepository.findPermissionsByUserId(userId);

    const rolesResult = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    return {
      userId: user.userId,
      email: user.email,
      roles: rolesResult.map(ur => ur.role.roleName),
      permissions: permissions,
    } as UserRequestPayload;
  }

  async updateUser(userId: number, updateData: UserUpdateDto): Promise<void> {
    await this.userRepository.update({ userId }, updateData);
  }

  async saveRefreshToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<RefreshTokenEntity> {
    return this.refreshTokenRepository.createToken(userId, tokenHash, expiresAt);
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    return this.refreshTokenRepository.findTokenByHashWithUser(tokenHash);
  }

  async revokeRefreshToken(tokenId: number): Promise<void> {
    await this.refreshTokenRepository.revokeTokenById(tokenId);
  }
}
