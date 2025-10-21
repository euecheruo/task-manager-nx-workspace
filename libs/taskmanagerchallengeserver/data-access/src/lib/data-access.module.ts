import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { UserRoleEntity } from './entities/user-role.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { TaskEntity } from './entities/task.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { UserRepository } from './repositories/user.repository';
import { RoleRepository } from './repositories/role.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { TaskRepository } from './repositories/task.repository';

const ENTITIES = [
  UserEntity,
  RoleEntity,
  PermissionEntity,
  UserRoleEntity,
  RolePermissionEntity,
  TaskEntity,
  RefreshTokenEntity,
];

const REPOSITORIES = [
  UserRepository,
  RoleRepository,
  RefreshTokenRepository,
  TaskRepository,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: false,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: ENTITIES,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') !== 'production' ? ['query', 'error'] : ['error'],
      }),
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  providers: [...REPOSITORIES],
  exports: [TypeOrmModule, ...REPOSITORIES],
})

export class DataAccessModule {}
