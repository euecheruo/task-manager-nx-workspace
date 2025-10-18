import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@task-manager-nx-workspace/api/config';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { UserEntity } from '@task-manager-nx-workspace/api/users/lib/entities/user.entity';
import { RefreshTokenEntity } from '@task-manager-nx-workspace/api/users/lib/entities/refresh-token.entity';
import { RoleEntity } from '@task-manager-nx-workspace/api/roles/lib/entities/role.entity';
import { PermissionEntity } from '@task-manager-nx-workspace/api/roles/lib/entities/permission.entity';
import { UserRoleEntity } from '@task-manager-nx-workspace/api/roles/lib/entities/user-role.entity';
import { RolePermissionEntity } from '@task-manager-nx-workspace/api/roles/lib/entities/role-permission.entity';
import { TaskEntity } from '@task-manager-nx-workspace/api/tasks/lib/entities/task.entity';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (envService: EnvironmentService) => {

        return ({
          type: 'postgres',
          host: envService.get<string>('POSTGRES_HOST'),
          port: envService.get<number>('POSTGRES_PORT'),
          username: envService.get<string>('POSTGRES_USER'),
          password: envService.get<string>('POSTGRES_PASSWORD'),
          database: envService.get<string>('POSTGRES_DB'),

          entities: [
            UserEntity, RefreshTokenEntity,
            RoleEntity, PermissionEntity,
            UserRoleEntity, RolePermissionEntity,
            TaskEntity,
          ],
          synchronize: envService.get<boolean>('DB_SYNCHRONIZE'),
          logging: envService.isDevelopment() ? ['query', 'error'] : ['error'],
        });
      },
      inject: [EnvironmentService],
    }),
  ],
  providers: [],
  exports: [TypeOrmModule, ConfigModule],
})
export class CoreModule { }
