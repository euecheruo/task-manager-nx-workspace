import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@task-manager-nx-workspace/api/config';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { UserEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/user.entity';
import { RefreshTokenEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/refresh-token.entity';
import { RoleEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/role.entity';
import { PermissionEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/permission.entity';
import { UserRoleEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/user-role.entity';
import { RolePermissionEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/role-permission.entity';
import { TaskEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/task.entity';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (envService: EnvironmentService) => {
        const dbConfig = envService.getDatabaseConfig();
        const isDev = envService.isDevelopment();
        return {
          type: 'postgres',
          ...dbConfig,
          entities: [
            UserEntity,
            RefreshTokenEntity,
            RoleEntity,
            PermissionEntity,
            UserRoleEntity,
            RolePermissionEntity,
            TaskEntity,
          ],
          synchronize: isDev,
          logging: isDev ? ['query', 'error', 'schema'] : ['error'],
        };
      },
      inject: [EnvironmentService],
    }),
  ],
  providers: [],
  exports: [TypeOrmModule, ConfigModule],
})

export class CoreModule { }
