import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserRoleEntity } from '../entities/user-role.entity';

@Injectable()
export class UserRoleRepository extends Repository<UserRoleEntity> {
  constructor(private dataSource: DataSource) {
    super(UserRoleEntity, dataSource.createEntityManager());
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<UserRoleEntity> {
    const newUserRole = this.create({
      userId: userId,
      roleId: roleId,
    });
    return this.save(newUserRole);
  }

  async findPermissionsByUserId(userId: number): Promise<string[]> {
    const userRoles = await this.createQueryBuilder('userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermission')
      .leftJoinAndSelect('rolePermission.permission', 'permission')
      .where('userRole.userId = :userId', { userId })
      .getMany();

    const permissions = new Set<string>();
    for (const userRole of userRoles) {
      if (userRole.role && userRole.role.rolePermissions) {
        for (const rolePermission of userRole.role.rolePermissions) {
          if (rolePermission.permission) {
            permissions.add(rolePermission.permission.name);
          }
        }
      }
    }
    return Array.from(permissions);
  }
}
