import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/role.entity';
import { PermissionEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/permission.entity';
import { UserRoleEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/user-role.entity';
import { RolePermissionEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/role-permission.entity';
import { RoleRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/role.repository';
import { PermissionRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/permission.repository';
import { UserRoleRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/user-role.repository';
import { RolePermissionRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/role-permission.repository';
import { RolesService } from './services/roles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      UserRoleEntity,
      RolePermissionEntity
    ]),
  ],
  providers: [
    RolesService,
    RoleRepository,
    PermissionRepository,
    UserRoleRepository,
    RolePermissionRepository,
  ],
  exports: [RolesService],
})

export class RolesModule { }
