import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from '@task-manager-nx-workspace/api/users/lib/entities/user.entity';
import { RoleEntity } from './role.entity';

@Index(['userId', 'roleId'], { unique: true })
@Entity('user_roles')
export class UserRoleEntity {
  @PrimaryGeneratedColumn({ name: 'user_role_id' })
  userRoleId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'role_id' })
  roleId: number;

  @ManyToOne(() => UserEntity, user => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => RoleEntity, role => role.userRoles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;
}
