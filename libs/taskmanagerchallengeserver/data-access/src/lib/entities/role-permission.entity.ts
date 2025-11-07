// /workspace-root/libs/api/data-access/entities/role-permission.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
// Assuming other relationship entities are defined
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';
@Entity('role_permissions')
@Index(['roleId', 'permissionId'], { unique: true }) // Enforce UNIQUE (role_id, permission_id)
export class RolePermissionEntity {
  @PrimaryGeneratedColumn({ name: 'role_permission_id' })
  rolePermissionId: number;
  // Foreign key to Role (role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE)
  @Column({ name: 'role_id', nullable: false })
  roleId: number;
  // Foreign key to Permission (permission_id INT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE)
  @Column({ name: 'permission_id', nullable: false })
  permissionId: number;
  // Relationships

  // Many-to-One: Role
  @ManyToOne(() => RoleEntity, role => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;
  // Many-to-One: Permission
  @ManyToOne(() => PermissionEntity, permission => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: PermissionEntity;
}
