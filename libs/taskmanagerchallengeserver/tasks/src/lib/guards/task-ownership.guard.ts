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
 * TaskOwnershipGuard ensures that the authenticated user is the creator 
 * of the task resource being accessed (Update/Delete operations).
 * This enforces the "update:own:tasks" and "delete:own:tasks" policies.
 * 
 * NOTE: This guard should run AFTER the PermissionGuard has confirmed the user 
 * has the *right* to perform the *type* of action (RBAC). This guard checks the *resource scope* (ABAC).
 */
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

      const isOwner = task.creator_id === userId;

      if (isOwner) {
        this.logger.verbose(`User ${userId} is authorized for task ${taskId} (Owner).`);
        return true;
      } else {
        this.logger.warn(`User ${userId} denied access to task ${taskId}. Not the creator (Creator ID: ${task.creator_id}).`);
        throw new ForbiddenException('You can only update or delete tasks you have created.');
      }
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Error during task ownership check for task ${taskId}: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
