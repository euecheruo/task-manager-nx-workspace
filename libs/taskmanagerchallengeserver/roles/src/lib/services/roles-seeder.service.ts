import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { PermissionEntity } from '../entities/permission.entity';
import { RolePermissionEntity } from '../entities/role-permission.entity';

const ALL_PERMISSIONS: string[] = [
  'create:tasks', 'read:tasks', 'assign:tasks',
  'update:own:tasks', 'delete:own:tasks', 'unassign:tasks',
  'mark:assigned:tasks', 'unmark:assigned:tasks',
  'create:accounts', 'update:own:accounts', 'read:own:accounts',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  editor: [
    'create:tasks', 'read:tasks', 'assign:tasks',
    'update:own:tasks', 'delete:own:tasks', 'unassign:tasks',
    'mark:assigned:tasks', 'unmark:assigned:tasks',
    'create:accounts', 'update:own:accounts', 'read:own:accounts',
  ],
  viewer: [
    'read:tasks', 'assign:tasks', 'unassign:tasks',
    'mark:assigned:tasks', 'unmark:assigned:tasks',
    'create:accounts', 'update:own:accounts', 'read:own:accounts',
  ],
};

@Injectable()
export class RolesSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private permissionsRepository: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity)
    private rolePermissionsRepository: Repository<RolePermissionEntity>,
  ) { }

  async onModuleInit() {
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedRolePermissions();
  }

  private async seedPermissions() {
    for (const name of ALL_PERMISSIONS) {
      const exists = await this.permissionsRepository.createQueryBuilder('p')
        .where('p.permissionName = :name', { name })
        .getExists();
      if (!exists) {
        await this.permissionsRepository.save(this.permissionsRepository.create({ permissionName: name }));
      }
    }
  }

  private async seedRoles() {
    for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
      const exists = await this.rolesRepository.createQueryBuilder('r')
        .where('r.roleName = :roleName', { roleName })
        .getExists();

      if (!exists) {
        await this.rolesRepository.save(this.rolesRepository.create({ roleName }));
      }
    }
  }

  private async seedRolePermissions() {
    const roles = await this.rolesRepository.find();
    const permissions = await this.permissionsRepository.find();

    const rolePermissionLinks: RolePermissionEntity[] = [];

    for (const role of roles) {
      const rolePermNames = ROLE_PERMISSIONS[role.roleName] || [];

      for (const permName of rolePermNames) {
        const permission = permissions.find(p => p.permissionName === permName);

        if (permission) {
          const exists = await this.rolePermissionsRepository.createQueryBuilder('rp')
            .where('rp.roleId = :roleId', { roleId: role.roleId })
            .andWhere('rp.permissionId = :permissionId', { permissionId: permission.permissionId })
            .getExists();

          if (!exists) {
            rolePermissionLinks.push(this.rolePermissionsRepository.create({
              roleId: role.roleId,
              permissionId: permission.permissionId,
            }));
          }
        }
      }
    }

    if (rolePermissionLinks.length > 0) {
      await this.rolePermissionsRepository.save(rolePermissionLinks);
    }
  }
}
