import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';

@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true })
export class RolePermissionEntity {
  @PrimaryGeneratedColumn({ name: 'role_permission_id' })
  rolePermissionId!: number;
  @Column({ name: 'role_id', nullable: false })
  roleId!: number;
  @Column({ name: 'permission_id', nullable: false })
  permissionId!: number;

  @ManyToOne(() => RoleEntity, role => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;
  @ManyToOne(() => PermissionEntity, permission => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission!: PermissionEntity;
}
