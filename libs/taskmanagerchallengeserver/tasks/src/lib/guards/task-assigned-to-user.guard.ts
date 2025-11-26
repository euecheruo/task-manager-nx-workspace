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

/**
 * TaskAssignedToUserGuard ensures that the authenticated user is the one 
 * currently assigned to the task before they can mark it complete or incomplete.
 * 
 * This enforces the "mark:assigned:tasks" and "unmark:assigned:tasks" policies.
 * This guard runs after the PermissionGuard validates the general right to perform the action.
 */
@Injectable()
export class TaskAssignedToUserGuard implements CanActivate {
  private readonly logger = new Logger(TaskAssignedToUserGuard.name);

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
        this.logger.warn(`Task ID ${taskId} not found for assignment check.`);
        throw new NotFoundException(`Task with ID ${taskId} not found.`);
      }

      const isAssignedToUser = task.assignedUser?.userId === userId;

      if (isAssignedToUser) {
        this.logger.verbose(`User ${userId} is authorized for status change on task ${taskId} (Assigned).`);
        return true;
      } else {
        this.logger.warn(`User ${userId} denied status change on task ${taskId}. Not the assigned user (Assigned ID: ${task.assignedUser?.userId}).`);
        throw new ForbiddenException('You can only mark tasks complete/incomplete if they are assigned to you.');
      }
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Error during task assignment check for task ${taskId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
