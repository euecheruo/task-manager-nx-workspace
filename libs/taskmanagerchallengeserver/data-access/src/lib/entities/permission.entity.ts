import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { RolePermissionEntity } from './role-permission.entity';
@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn({ name: 'permission_id' })
  permissionId!: number;
  @Column({ name: 'permission_name', type: 'varchar', length: 50, unique: true, nullable: false })
  @Index({ unique: true })
  permissionName!: string;
 
  @OneToMany(() => RolePermissionEntity, rolePermission => rolePermission.permission)
  rolePermissions!: RolePermissionEntity;
}
