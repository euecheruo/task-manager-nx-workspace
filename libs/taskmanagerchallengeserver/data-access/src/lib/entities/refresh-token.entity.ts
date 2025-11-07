import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn({ name: 'token_id' })
  tokenId: number;
  @Column({ name: 'user_id' })
  userId: number;
  @Column({ name: 'token_hash', type: 'char', length: 64, unique: true })
  @Index({ unique: true })
  tokenHash: string;
  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  isRevoked: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;
  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  @ManyToOne(() => UserEntity, user => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
