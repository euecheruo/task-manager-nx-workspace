import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { UserRoleEntity } from './user-role.entity';
import { RolePermissionEntity } from './role-permission.entity';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn({ name: 'role_id' })
  roleId!: number;
  @Column({ name: 'role_name', type: 'varchar', length: 20, unique: true, nullable: false })
  @Index({ unique: true })
  roleName!: string;

  @OneToMany(() => UserRoleEntity, userRole => userRole.role)
  userRoles!: UserRoleEntity;

  @OneToMany(() => RolePermissionEntity, rolePermission => rolePermission.role)
  rolePermissions!: RolePermissionEntity;
}
