// /workspace-root/libs/api/tasks/guards/task-ownership.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { CurrentUserPayload } from '../../../../shared/src/lib/decorators/current-user.decorator';

@Injectable()
export class TaskOwnershipGuard implements CanActivate {
  private readonly logger = new Logger(TaskOwnershipGuard.name);

  constructor(private tasksService: TasksService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;
    const userId = user.userId;

    const taskId = parseInt(request.params.id, 10);

    if (isNaN(taskId)) {
      this.logger.warn(`Task ID parameter missing or invalid for user ${userId}.`);
      throw new NotFoundException('Task ID parameter missing or invalid.');
    }

    try {
      const task = await this.tasksService.findOne(taskId);

      if (!task) {
        this.logger.warn(`Task ID ${taskId} not found for ownership check.`);
        throw new NotFoundException(`Task with ID ${taskId} not found.`);
      }

      // === OWNERSHIP CHECK ===
      const isOwner = task.creatorId === userId;

      if (!isOwner) {
        this.logger.warn(
          `User ${userId} denied access to task ${taskId}. Not the creator (Creator ID: ${task.creatorId}).`,
        );
        throw new ForbiddenException('You can only update or delete tasks you have created.');
      }

      // === OPTIMIZATION ===
      // Attach the task to the request object so the Controller doesn't need to fetch it again.
      request['task'] = task;

      this.logger.verbose(`User ${userId} is authorized for task ${taskId} (Owner).`);
      return true;

    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      // It is often helpful to log the stack trace for unhandled errors
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error during task ownership check for task ${taskId}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
