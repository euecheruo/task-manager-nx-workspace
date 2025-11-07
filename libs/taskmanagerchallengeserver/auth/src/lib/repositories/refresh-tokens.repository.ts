import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { RefreshTokenEntity } from '../../../../data-access/src/lib/entities/refresh-token.entity';

/**
 * Utility function to generate a SHA256 hash of the refresh token.
 * This is used to securely store the token hash (CHAR(64)) instead of the raw token.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class RefreshTokensRepository {
  private readonly logger = new Logger(RefreshTokensRepository.name);
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private refreshTokensRepository: Repository<RefreshTokenEntity>,
  ) { }

  /**
   * Hashes the raw refresh token and stores the hash, linked to the user,
   * with its absolute expiration date.
   */
  async createToken(userId: number, refreshToken: string, expiresAt: Date): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const newRefreshToken = this.refreshTokensRepository.create({
      userId,
      tokenHash,
      expiresAt,
      isRevoked: false,
    });
    await this.refreshTokensRepository.save(newRefreshToken);
    this.logger.verbose(` Created new refresh token hash for user ${userId}. Expires: ${expiresAt.toISOString()}`);
  }

  /**
   * Validates a raw refresh token against the stored hash, checks expiration/revocation status,
   * and, if valid, immediately revokes the token (token rotation security).
   * @returns boolean indicating if the token was successfully validated and revoked.
   */
  async validateAndRevokeToken(userId: number, rawToken: string): Promise<boolean> {
    const tokenHash = hashToken(rawToken);
    const now = new Date();

    const tokenRecord = await this.refreshTokensRepository.findOne({
      where: { userId: userId as any, tokenHash: tokenHash },
    });
    if (!tokenRecord) {
      this.logger.warn(`Token validation failed for user ${userId}: Token hash not found.`);
      return false;
    }

    const isExpired = tokenRecord.expiresAt < now;
    const isRevoked = tokenRecord.isRevoked === true;

    if (isExpired) {
      this.logger.warn(`Token validation failed for user ${userId}: Token expired at ${tokenRecord.expiresAt.toISOString()}.`);
      return false;
    }

    if (isRevoked) {
      this.logger.warn(`Token validation failed for user ${userId}: Token already revoked.`);
      return false;
    }

    await this.refreshTokensRepository.update({ tokenId: tokenRecord.tokenId }, { isRevoked: true });
    this.logger.log(` Revoked old refresh token (ID: ${tokenRecord.tokenId}) for user ${userId}.`);
    return true;
  }

  /**
   * Revokes all refresh tokens belonging to a specific user. Used during logout.
   */
  async revokeAllTokensForUser(userId: number): Promise<void> {
    await this.refreshTokensRepository.update({ userId: userId as any, isRevoked: false }, { isRevoked: true });
    this.logger.log(` Revoked all active refresh tokens for user ${userId}.`);
  }
}
