import { Module } from '@nestjs/common';
import { TasksService } from './services/tasks.service';
import { TasksController } from './controllers/tasks.controller';
import { DataAccessModule } from '@task-manager-nx-workspace/api/data-access';
import { TaskRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/task.repository';
import { UsersModule } from '@task-manager-nx-workspace/api/users';

@Module({
  imports: [
    DataAccessModule,
    UsersModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskRepository],
  exports: [TasksService],
})

export class TasksModule { }
