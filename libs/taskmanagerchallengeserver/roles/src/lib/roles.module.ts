import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { RolesSeederService } from './services/roles-seeder.service';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      UserRoleEntity
    ]),
  ],
  controllers: [],
  providers: [
    RolesService,
    RolesSeederService,
    EnvironmentService
  ],
  exports: [RolesService],
})
export class RolesModule { }
