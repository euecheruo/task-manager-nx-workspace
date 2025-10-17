import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserEntity } from '../entities/user.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { UserData } from '@task-manager-nx-workspace/api/shared/lib/interfaces/users/user-data.interface';
import { UserUpdateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-update.dto';
import { RolesService } from '@task-manager-nx-workspace/api/roles/lib/services/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private refreshTokensRepository: Repository<RefreshTokenEntity>,
    private rolesService: RolesService,
  ) { }

  async findUserById(userId: number): Promise<UserData> {
    const user = await this.usersRepository.findOne({ where: { userId } });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    const { passwordHash, ...safeUserData } = user;
    return safeUserData;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async createUser(data: { email: string; passwordHash: string; roleName: string }): Promise<UserData> {
    const user = this.usersRepository.create({
      email: data.email,
      passwordHash: data.passwordHash,
    });
    const savedUser = await this.usersRepository.save(user);

    await this.rolesService.assignRoleToUser(savedUser.userId, data.roleName);

    const { passwordHash, ...safeUserData } = savedUser;
    return safeUserData;
  }

  async updateUserPassword(userId: number, updateDto: UserUpdateDto): Promise<UserData> {
    const user = await this.usersRepository.findOne({ where: { userId } });

    const isPasswordValid = await bcrypt.compare(updateDto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('The current password provided is incorrect.');
    }

    if (updateDto.newPassword) {
      const saltRounds = 10;
      user.passwordHash = await bcrypt.hash(updateDto.newPassword, saltRounds);

      await this.revokeAllRefreshTokensForUser(userId);
    } else {
      throw new BadRequestException('No new password provided.');
    }

    const savedUser = await this.usersRepository.save(user);
    const { passwordHash, ...safeUserData } = savedUser;
    return safeUserData;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async storeRefreshToken(userId: number, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.rolesService.getRefreshTokenExpirationMilliseconds());

    const newRefreshToken = this.refreshTokensRepository.create({
      userId,
      tokenHash,
      isRevoked: false,
      expiresAt,
    });

    await this.refreshTokensRepository.save(newRefreshToken);
  }

  async revokeAndVerifyRefreshToken(userId: number, token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    const tokenRecord = await this.refreshTokensRepository.findOne({
      where: { userId, tokenHash, isRevoked: false },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return false;
    }

    tokenRecord.isRevoked = true;
    await this.refreshTokensRepository.save(tokenRecord);

    return true;
  }

  async revokeAllRefreshTokensForUser(userId: number): Promise<void> {
    await this.refreshTokensRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }
}
