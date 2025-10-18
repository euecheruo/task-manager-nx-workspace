import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserData } from '@task-manager-nx-workspace/api/shared/lib/interfaces/users/user-data.interface';
import { SignUpDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/sign-up.dto';
// FIX: Use the correct DTO for the update operation
import { UserUpdateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-update.dto';
import { UserProfileDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-profile.dto';
import { RolesService } from '@task-manager-nx-workspace/api/roles/lib/services/roles.service';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private refreshTokensRepository: Repository<RefreshTokenEntity>,
    private rolesService: RolesService,
  ) { }

  // --- Utility Mappers ---

  private mapToUserData(entity: UserEntity): UserData {
    return {
      userId: entity.userId,
      email: entity.email,
      createdAt: entity.createdAt,
    };
  }

  private mapToUserProfileDto(user: UserEntity, roles: string[], permissions: string[]): UserProfileDto {
    return {
      userId: user.userId,
      email: user.email,
      createdAt: user.createdAt,
      roles: roles as any,
      permissions: permissions as any,
    };
  }

  async findUserById(userId: number): Promise<UserData | null> {
    const user = await this.usersRepository.findOne({ where: { userId } });
    return user ? this.mapToUserData(user) : null;
  }

  async findUserByEmailWithHash(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['userId', 'email', 'passwordHash', 'createdAt']
    });
  }

  async findProfileById(userId: number): Promise<UserProfileDto> {
    const user = await this.usersRepository.findOne({ where: { userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const { roles, permissions } = await this.rolesService.getRolesAndPermissionsForUser(userId);

    return this.mapToUserProfileDto(user, roles, permissions);
  }

  async create(signUpDto: SignUpDto): Promise<UserData> {
    const existingUserCount = await this.usersRepository.count({ where: { email: signUpDto.email } });

    if (existingUserCount > 0) {
      throw new ConflictException('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(signUpDto.password, this.SALT_ROUNDS);

    const newUser = this.usersRepository.create({ email: signUpDto.email, passwordHash: passwordHash });

    try {
      const savedUser = await this.usersRepository.save(newUser);
      await this.rolesService.assignDefaultRoleToUser(savedUser.userId);
      return this.mapToUserData(savedUser);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user account.');
    }
  }

  async update(userId: number, userUpdateDto: UserUpdateDto): Promise<UserProfileDto> {
    let user = await this.usersRepository.findOne({
      where: { userId },
      select: ['userId', 'email', 'createdAt', 'passwordHash']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const isPasswordValid = await bcrypt.compare(userUpdateDto.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new ForbiddenException('Current password verification failed. Invalid password.');
    }

    if (userUpdateDto.newPassword) {
      user.passwordHash = await bcrypt.hash(userUpdateDto.newPassword, this.SALT_ROUNDS);
    }

    user = await this.usersRepository.save(user);

    return this.findProfileById(userId);
  }

  async saveRefreshToken(userId: number, tokenHash: string, expiresAt: Date): Promise<RefreshTokenEntity> {
    const newToken = this.refreshTokensRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });
    return this.refreshTokensRepository.save(newToken);
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const now = new Date();
    return this.refreshTokensRepository.findOne({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: MoreThan(now),
      },
      relations: ['user']
    });
  }

  async revokeRefreshToken(tokenId: number): Promise<void> {
    await this.refreshTokensRepository.update(tokenId, { isRevoked: true });
  }
}
