import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskController } from './controllers/task.controller';
import { TaskAssignmentController } from './controllers/task-assignment.controller';
import { TaskService } from './services/task.service';
import { TaskEntity } from './entities/task.entity';
import { TaskAssignmentEntity } from './entities/task-assignment.entity';
import { AuthModule } from '@task-manager-nx-workspace/shared/auth/lib/auth.module';
import { ActivityModule } from '@task-manager-nx-workspace/activity/lib/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity, TaskAssignmentEntity]),
    AuthModule,
    ActivityModule,
  ],
  controllers: [
    TaskController,
    TaskAssignmentController,
  ],
  providers: [
    TaskService,
  ],
  exports: [
    TaskService,
    TypeOrmModule.forFeature([TaskEntity, TaskAssignmentEntity]),
  ],
})
export class TaskModule { }
