import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmConfig } from './database.config';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { TaskEntity } from '@task-manager-nx-workspace/task/lib/entities/task.entity';
import { TaskAssignmentEntity } from '@task-manager-nx-workspace/task/lib/entities/task-assignment.entity';
import { ActivityEntity } from '@task-manager-nx-workspace/activity/lib/entities/activity.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: parseInt(configService.get<string>('POSTGRES_PORT') || '5432', 10),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DB'),
        entities: [
          UserEntity,
          RoleEntity,
          TaskEntity,
          TaskAssignmentEntity,
          ActivityEntity,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
        migrationsRun: typeOrmConfig.migrationsRun,
        migrations: typeOrmConfig.migrations,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }
