import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { RefreshTokenEntity } from './refresh-token.entity';
import { UserRoleEntity } from '@task-manager-nx-workspace/api/roles/lib/entities/user-role.entity';
import { TaskEntity } from '../../tasks/entities/task.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'password_hash', length: 60, select: false })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToMany(() => RefreshTokenEntity, refreshToken => refreshToken.user)
  refreshTokens: RefreshTokenEntity[];

  @OneToMany(() => UserRoleEntity, userRole => userRole.user)
  userRoles: UserRoleEntity[];

  @OneToMany(() => TaskEntity, task => task.creator)
  createdTasks: TaskEntity[];

  @OneToMany(() => TaskEntity, task => task.assignedUser)
  assignedTasks: TaskEntity[];
}
