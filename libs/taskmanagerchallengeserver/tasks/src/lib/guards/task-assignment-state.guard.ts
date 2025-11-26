// /workspace-root/libs/api/tasks/guards/task-assignment-state.guard.spec.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';

@Injectable()
export class TaskAssignmentStateGuard implements CanActivate {
  private readonly logger = new Logger(TaskAssignmentStateGuard.name);

  constructor(private tasksService: TasksService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const isAssignAttempt = url.includes('/assign') && !url.includes('/unassign');

    const taskId = parseInt(request.params.id, 10);
    const userId = request.user?.userId;

    if (isNaN(taskId)) {
      throw new NotFoundException('Task ID parameter missing or invalid.');
    }

    try {
      const task = await this.tasksService.findOne(taskId);
      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found.`);
      }

      // FIXED: Check assignedUserId directly. 
      // Previous `task.assignedUser?.userId!== null` evaluated to true for undefined.
      const isCurrentlyAssigned = task.assignedUserId !== null && task.assignedUserId !== undefined;

      if (isAssignAttempt) {
        if (isCurrentlyAssigned) {
          this.logger.warn(`User ${userId} attempted to assign task ${taskId}, but it is already assigned.`);
          throw new ForbiddenException('Cannot assign a task that is already assigned.');
        }
      } else {
        // Unassign attempt
        if (!isCurrentlyAssigned) {
          this.logger.warn(`User ${userId} attempted to unassign task ${taskId}, but it is currently unassigned.`);
          throw new ForbiddenException('Cannot unassign a task that is already unassigned.');
        }
      }

      return true;

    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error during task state check: ${error}`);
      throw error;
    }
  }
}
