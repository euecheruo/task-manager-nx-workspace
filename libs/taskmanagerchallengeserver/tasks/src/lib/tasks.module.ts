import { Module } from '@nestjs/common';
import { TasksController } from './controllers/tasks.controller';
import { TasksService } from './services/tasks.service';
import { TasksRepository } from './repositories/tasks.repository';
import { TaskOwnershipGuard } from './guards/task-ownership.guard';
import { TaskAssignedToUserGuard } from './guards/task-assigned-to-user.guard';
import { TaskAssignmentStateGuard } from './guards/task-assignment-state.guard';
import { UsersModule } from '../../../users/src/lib/users.module';

@Module({
  imports: [
    UsersModule,
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    TasksRepository,
    TaskOwnershipGuard,
    TaskAssignedToUserGuard,
    TaskAssignmentStateGuard,
  ],
  exports: [
    TasksService,
  ],
})
export class TasksModule { }
