import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { RefreshTokenEntity } from './refresh-token.entity';
import { TaskEntity } from './task.entity';
import { UserRoleEntity } from './user-role.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;
  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  @Index({ unique: true })
  email: string;
  @Column({ name: 'password_hash', type: 'char', length: 60, nullable: false })
  passwordHash: string;
  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => TaskEntity, task => task.creator)
  createdTasks: TaskEntity;
  @OneToMany(() => TaskEntity, task => task.assignedUser)
  assignedTasks: TaskEntity;
  @OneToMany(() => RefreshTokenEntity, token => token.user)
  refreshTokens: RefreshTokenEntity;
  @OneToMany(() => UserRoleEntity, userRole => userRole.user)
  userRoles: UserRoleEntity;
}
