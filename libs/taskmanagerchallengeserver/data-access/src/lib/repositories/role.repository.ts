import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends Repository<RoleEntity> {
  constructor(private dataSource: DataSource) {
    super(RoleEntity, dataSource.createEntityManager());
  }

  async findOneByName(roleName: string): Promise<RoleEntity | null> {
    return this.findOne({
      where: { roleName },
    });
  }

  async getPermissionsByRoleId(roleId: number): Promise<string[]> {
    const results = await this.createQueryBuilder('role')
      .leftJoin('role.rolePermissions', 'rolePermission')
      .leftJoin('rolePermission.permission', 'permission')
      .select('permission.permissionName', 'permissionName')
      .where('role.roleId = :roleId', { roleId })
      .getRawMany();

    return results.map(row => row.permissionName);
  }

  async getPermissionsByRoleIds(roleIds: number[]): Promise<string[]> {
    if (!roleIds || roleIds.length === 0) {
      return [];
    }

    const results = await this.createQueryBuilder('role')
      .leftJoin('role.rolePermissions', 'rolePermission')
      .leftJoin('rolePermission.permission', 'permission')
      .select('permission.permissionName', 'permissionName')
      .distinct(true)
      .where('role.roleId IN (:...roleIds)', { roleIds })
      .getRawMany();

    return results.map(row => row.permissionName);
  }
}
