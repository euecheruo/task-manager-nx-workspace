import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TasksService } from '../services/tasks.service';

/**
 * TaskAssignmentStateGuard checks the current assignment state of a task
 * before allowing assignment (must be unassigned) or unassignment (must be assigned).
 * 
 * This guard runs after the PermissionGuard validates the user's general right (RBAC)
 * to perform the assignment/unassignment action.
 */
@Injectable()
export class TaskAssignmentStateGuard implements CanActivate {
  private readonly logger = new Logger(TaskAssignmentStateGuard.name);

  constructor(private tasksService: TasksService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const isAssignAttempt = url.includes('/assign');

    const taskId = parseInt(request.params.id, 10);
    const userId = request.user?.userId; // For logging context

    if (isNaN(taskId)) {
      this.logger.warn(`Task ID parameter missing or invalid for user ${userId}.`);
      throw new NotFoundException('Task ID parameter missing or invalid.');
    }

    try {
      const task = await this.tasksService.findOne(taskId);

      if (!task) {
        this.logger.warn(`Task ID ${taskId} not found for assignment state check.`);
        throw new NotFoundException(`Task with ID ${taskId} not found.`);
      }

      const isCurrentlyAssigned = task.assignedUser?.userId !== null;

      if (isAssignAttempt) {
        if (isCurrentlyAssigned) {
          this.logger.warn(`User ${userId} attempted to assign task ${taskId}, but it is already assigned to ${task.assignedUser?.userId}.`);
          throw new ForbiddenException('Cannot assign a task that is already assigned.');
        }
      } else {
        if (!isCurrentlyAssigned) {
          this.logger.warn(`User ${userId} attempted to unassign task ${taskId}, but it is currently unassigned.`);
          throw new ForbiddenException('Cannot unassign a task that is already unassigned.');
        }
      }

      this.logger.verbose(`User ${userId} authorized for state transition on task ${taskId}.`);
      return true;

    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Error during task state check for task ${taskId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
