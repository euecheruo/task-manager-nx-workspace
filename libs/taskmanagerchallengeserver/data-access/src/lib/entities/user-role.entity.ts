import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';
@Entity('user_roles')
@Index(['userId', 'roleId'], { unique: true })
export class UserRoleEntity {
  @PrimaryGeneratedColumn({ name: 'user_role_id' })
  userRoleId: number;
  @Column({ name: 'user_id', nullable: false })
  userId: number;

  @Column({ name: 'role_id', nullable: false })
  roleId: number;
  @ManyToOne(() => UserEntity, user => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
  @ManyToOne(() => RoleEntity, role => role.userRoles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;
}
