import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';

import { TaskEntity } from '@task-manager-nx-workspace/task/lib/entities/task.entity';
import { TaskAssignmentEntity } from '@task-manager-nx-workspace/task/lib/entities/task-assignment.entity';
//import { ActivityEntity } from '@task-manager-nx-workspace/activity/lib/entities/activity.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    UserEntity,
    RoleEntity,
    TaskEntity,
    TaskAssignmentEntity,
    //ActivityEntity,
  ],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  migrationsRun: false,
  migrations: ['dist/libs/api/shared/src/database/migrations/*.js'],
};
