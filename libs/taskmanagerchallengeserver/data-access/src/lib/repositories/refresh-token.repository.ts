import { DataSource, Repository, MoreThan, LessThan } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository extends Repository<RefreshTokenEntity> {
  constructor(private dataSource: DataSource) {
    super(RefreshTokenEntity, dataSource.createEntityManager());
  }

  async createToken(
    userId: number,
    tokenHash: string,
    expiresIn: Date,
  ): Promise<RefreshTokenEntity> {
    const newToken = this.create({
      userId,
      tokenHash,
      expiresAt: expiresIn,
      isRevoked: false,
    });
    return this.save(newToken);
  }

  async findTokenByHashWithUser(tokenHash: string): Promise<RefreshTokenEntity | null> {
    return this.findOne({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async revokeTokenById(tokenId: number): Promise<void> {
    await this.update(
      { tokenId },
      { isRevoked: true },
    );
  }

  async revokeAllTokensForUser(userId: number): Promise<void> {
    await this.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
