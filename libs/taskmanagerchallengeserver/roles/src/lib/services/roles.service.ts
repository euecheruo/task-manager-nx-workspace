import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private userRolesRepository: Repository<UserRoleEntity>,
    private envService: EnvironmentService,
  ) { }

  async getPermissionsByUserId(userId: number): Promise<string[]> {
    try {
      // Joins User -> UserRole -> Role -> RolePermission -> Permission
      const result = await this.rolesRepository.createQueryBuilder('role')
        .innerJoin('role.rolePermissions', 'rp')
        .innerJoin('rp.permission', 'permission')
        .innerJoin('role.userRoles', 'ur')
        .where('ur.userId = :userId', { userId })
        .select('permission.permissionName', 'permission')
        .distinct(true)
        .getRawMany();

      return result.map(row => row.permission);
    } catch (error) {
      console.error('Error fetching permissions for user:', userId, error);
      throw new InternalServerErrorException('Failed to retrieve user permissions.');
    }
  }

  async getPermissionsByRoleName(roleName: string): Promise<string[]> {
    const role = await this.rolesRepository.findOne({
      where: { roleName },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found.`);
    }

    return role.rolePermissions.map(rp => rp.permission.permissionName);
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

  getRefreshTokenExpirationMilliseconds(): number {
    const expirationString = this.envService.getJwtRefreshExpiration();
    return 7 * 24 * 60 * 60 * 1000;  }
}
