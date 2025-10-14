import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@task-manager-nx-workspace/shared/auth/lib/auth.module';
import { UserEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/user.entity'; // User entity for Auth0 ID linking
import { TaskEntity } from './entities/task.entity';
import { TaskAssignmentEntity } from './entities/task-assignment.entity';
import { TaskService } from './services/task.service';
import { TaskAssignmentService } from './services/task-assignment.service';
import { TaskController } from './controllers/task.controller';
import { TaskAssignmentController } from './controllers/task-assignment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskEntity,
      TaskAssignmentEntity,
      UserEntity
    ]),
    AuthModule,
  ],
  controllers: [
    TaskController,
    TaskAssignmentController
  ],
  providers: [
    TaskService,
    TaskAssignmentService
  ],
  exports: [
    TaskService
  ],
})
export class TaskModule { }
