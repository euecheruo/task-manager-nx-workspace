import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './services/seeder.service';
import { UserEntity } from '../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/user.entity';
import { RoleEntity } from '../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/role.entity';
import { PermissionEntity } from '../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/permission.entity';
import { RolePermissionEntity } from '../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/role-permission.entity';
import { UserRoleEntity } from '../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/user-role.entity';
import { TaskEntity } from '../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/task.entity';
import { RefreshTokenEntity } from '../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/refresh-token.entity';

@Module({
  imports: [],
  controllers: [],
  providers: [
    SeederService,
  ],
  exports: [
    SeederService,
  ],
})

export class SeederModule { }
