import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('refresh_tokens')
@Unique(['tokenHash'])
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn({ name: 'token_id' })
  tokenId: number;

  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @Column({ type: 'char', length: 64, name: 'token_hash', nullable: false })
  tokenHash: string;

  @Column({ name: 'is_revoked', default: false })
  isRevoked: boolean;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: false })
  expiresAt: Date;

  @Column({ type: 'timestamptz', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
