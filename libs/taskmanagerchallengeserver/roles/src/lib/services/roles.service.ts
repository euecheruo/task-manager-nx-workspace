import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity'; // Updated path assumption
import { PermissionEntity } from '../entities/permission.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { RolePermissionEntity } from '../entities/role-permission.entity';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';

interface UserAuthorizationData {
  roles: string[];
  permissions: string[];
}

@Injectable()
export class RolesService {
  private readonly DEFAULT_ROLE_NAME = 'viewer';

  constructor(
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private userRolesRepository: Repository<UserRoleEntity>,
    @InjectRepository(PermissionEntity)
    private permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity)
    private rolePermissionRepository: Repository<RolePermissionEntity>,
    private envService: EnvironmentService,
  ) { }

  async getRolesAndPermissionsForUser(userId: number): Promise<UserAuthorizationData> {
    try {
      const rolesResult = await this.rolesRepository.createQueryBuilder('role')
        .innerJoin('role.userRoles', 'ur')
        .where('ur.userId = :userId', { userId })
        .select('role.roleId', 'roleId')
        .addSelect('role.roleName', 'roleName')
        .getRawMany();

      const roleNames = rolesResult.map(r => r.roleName);
      const roleIds = rolesResult.map(r => r.roleId);

      if (roleIds.length === 0) {
        return { roles: [], permissions: [] };
      }

      const permissionRecords = await this.permissionRepository.createQueryBuilder('permission')
        .innerJoin('permission.rolePermissions', 'rp')
        .where('rp.roleId IN (:...roleIds)', { roleIds })
        .select('permission.permissionName', 'permissionName')
        .distinct(true)
        .getRawMany();

      const permissionNames = permissionRecords.map(p => p.permissionName);

      return {
        roles: roleNames,
        permissions: permissionNames,
      };
    } catch (error) {
      console.error(`Error fetching RBAC data for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to retrieve user authorization data.');
    }
  }

  async assignDefaultRoleToUser(userId: number): Promise<void> {
    const defaultRole = await this.rolesRepository.findOne({
      where: { roleName: this.DEFAULT_ROLE_NAME },
    });

    if (!defaultRole) {
      throw new NotFoundException(`Default role '${this.DEFAULT_ROLE_NAME}' not found. Database seeding required.`);
    }

    try {
      const userRole = this.userRolesRepository.create({
        userId: userId,
        roleId: defaultRole.roleId,
      });
      await this.userRolesRepository.save(userRole);
    } catch (error) {
      if (error.code !== '23505') {
        console.error(`Error assigning default role to user ${userId}:`, error);
        throw new InternalServerErrorException('Failed to assign default role.');
      }
    }
  }

  async getPermissionsByUserId(userId: number): Promise<string[]> {
    const { permissions } = await this.getRolesAndPermissionsForUser(userId);
    return permissions;
  }

  async getPermissionsByRoleName(roleName: string): Promise<string[]> {
    const role = await this.rolesRepository.findOne({ where: { roleName } });
    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found.`);
    }
    const roleId = role.roleId;

    const permissionRecords = await this.permissionRepository.createQueryBuilder('permission')
      .innerJoin('permission.rolePermissions', 'rp')
      .where('rp.roleId = :roleId', { roleId })
      .select('permission.permissionName', 'permissionName')
      .distinct(true)
      .getRawMany();

    return permissionRecords.map(p => p.permissionName);
  }

  async assignRoleToUser(userId: number, roleName: string): Promise<void> {
    const role = await this.rolesRepository.findOne({ where: { roleName } });
    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found for assignment.`);
    }
    const userRole = this.userRolesRepository.create({
      userId,
      roleId: role.roleId,
    });

    await this.userRolesRepository.save(userRole);
  }

  getRefreshTokenExpirationMilliseconds(expirationString: string): number {
    const match = expirationString.match(/^(\d+)([h|d])$/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h': 
        return value * 60 * 60 * 1000;
      case 'd': 
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

}
