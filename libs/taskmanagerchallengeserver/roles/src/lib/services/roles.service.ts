import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RoleRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/role.repository';
import { PermissionRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/permission.repository';
import { UserRoleRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/user-role.repository';
import { UserEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/user.entity';
import { RolePermissionRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/role-permission.repository';

export const CORE_PERMISSIONS = {
  CREATE_TASKS: 'create:tasks',
  READ_TASKS: 'read:tasks',
  ASSIGN_TASKS: 'assign:tasks',
  UPDATE_OWN_TASKS: 'update:own:tasks',
  DELETE_OWN_TASKS: 'delete:own:tasks',
  UNASSIGN_TASKS: 'unassign:tasks',
  MARK_ASSIGNED_TASKS: 'mark:assigned:tasks',
  UNMARK_ASSIGNED_TASKS: 'unmark:assigned:tasks',
  CREATE_ACCOUNTS: 'create:accounts',
  UPDATE_OWN_ACCOUNTS: 'update:own:accounts',
  READ_OWN_ACCOUNTS: 'read:own:accounts',
};

const ROLE_PERMISSIONS_MAP = {
  editor: [
    CORE_PERMISSIONS.CREATE_TASKS,
    CORE_PERMISSIONS.READ_TASKS,
    CORE_PERMISSIONS.ASSIGN_TASKS,
    CORE_PERMISSIONS.UPDATE_OWN_TASKS,
    CORE_PERMISSIONS.DELETE_OWN_TASKS,
    CORE_PERMISSIONS.UNASSIGN_TASKS,
    CORE_PERMISSIONS.MARK_ASSIGNED_TASKS,
    CORE_PERMISSIONS.UNMARK_ASSIGNED_TASKS,
    CORE_PERMISSIONS.CREATE_ACCOUNTS,
    CORE_PERMISSIONS.UPDATE_OWN_ACCOUNTS,
    CORE_PERMISSIONS.READ_OWN_ACCOUNTS,
  ],
  viewer: [
    CORE_PERMISSIONS.READ_TASKS,
    CORE_PERMISSIONS.ASSIGN_TASKS,
    CORE_PERMISSIONS.UNASSIGN_TASKS,
    CORE_PERMISSIONS.MARK_ASSIGNED_TASKS,
    CORE_PERMISSIONS.UNMARK_ASSIGNED_TASKS,
    CORE_PERMISSIONS.CREATE_ACCOUNTS,
    CORE_PERMISSIONS.UPDATE_OWN_ACCOUNTS,
    CORE_PERMISSIONS.READ_OWN_ACCOUNTS,
  ],
};

const DEFAULT_USER_ROLE = 'viewer';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly rolePermissionRepository: RolePermissionRepository,
  ) { }

  async onModuleInit() {
    await this.seedRolesAndPermissions();
  }

  private async seedRolesAndPermissions(): Promise<void> {
    const permissionsToSeed = Object.values(CORE_PERMISSIONS);

    const existingPermissions = await this.permissionRepository.find();
    const existingPermissionNames = new Set(existingPermissions.map(p => p.name));

    for (const permName of permissionsToSeed) {
      if (!existingPermissionNames.has(permName)) {
        await this.permissionRepository.save(this.permissionRepository.create({ name: permName }));
      }
    }
    this.logger.log(`Permissions seeded/verified: ${permissionsToSeed.length} total.`);

    const allPermissionEntities = await this.permissionRepository.find();
    const permissionMap = new Map(allPermissionEntities.map(p => [p.name, p.permissionId]));

    for (const [roleName, requiredPermissions] of Object.entries(ROLE_PERMISSIONS_MAP)) {
      let role = await this.roleRepository.findOneByName(roleName);

      if (!role) {
        role = await this.roleRepository.save(this.roleRepository.create({ roleName }));
        this.logger.log(`Role '${roleName}' created.`);
      }

      for (const permName of requiredPermissions) {
        const permissionId = permissionMap.get(permName);
        if (permissionId) {
          const linkExists = await this.rolePermissionRepository.findOne({
            where: { roleId: role.roleId, permissionId: permissionId }
          });

          if (!linkExists) {
            await this.rolePermissionRepository.save(
              this.rolePermissionRepository.create({ roleId: role.roleId, permissionId })
            );
            this.logger.log(`Permission '${permName}' linked to Role '${roleName}'.`);
          }
        }
      }
    }
  }

  async findRoleByName(roleName: string) {
    return this.roleRepository.findOneByName(roleName);
  }

  async assignDefaultRoleToUser(user: UserEntity): Promise<void> {
    const defaultRole = await this.roleRepository.findOneByName(DEFAULT_USER_ROLE);

    if (!defaultRole) {
      this.logger.error(`Default role '${DEFAULT_USER_ROLE}' not found during user signup.`);
      throw new Error(`Default role '${DEFAULT_USER_ROLE}' not found.`);
    }

    await this.userRoleRepository.assignRoleToUser(user.userId, defaultRole.roleId);
  }

  getRefreshTokenExpirationMilliseconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      this.logger.error(`Invalid JWT_REFRESH_EXPIRATION format: ${expiresIn}`);
      throw new Error('Invalid JWT refresh expiration format.');
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  }
}
