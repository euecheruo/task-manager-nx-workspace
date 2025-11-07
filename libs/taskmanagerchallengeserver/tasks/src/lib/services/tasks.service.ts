
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from '../dtos/create-task.dtos';
import { UpdateTaskDto } from '../dtos/update-task.dtos';
import { TaskFilterQuery } from '../dtos/task-filter.query';
import { SingleTaskResponse, TaskResponseDto } from '../dtos/task-response.dtos';
import { TasksRepository } from '../repositories/tasks.repository';
import { UsersRepository } from '../../../../users/src/lib/repositories/users.repository';
import { TaskEntity } from '../../../../data-access/src/lib/entities/task.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private tasksRepository: TasksRepository,
    private usersRepository: UsersRepository,
  ) { }

  /**
   * Utility function to map TaskEntity (DB structure) to SingleTaskResponse (API DTO structure).
   */
  private mapTaskEntityToDto(entity: TaskEntity): SingleTaskResponse {
    return {
      taskId: entity.task_id,
      title: entity.title,
      description: entity.description,
      creatorId: entity.creator_id,
      assignedUserId: entity.assigned_user_id,
      isCompleted: entity.is_completed,
      createdAt: entity.created_at,
      completedAt: entity.completed_at,
    };
  }


  /**
   * Retrieves a paginated list of tasks based on filters.
   */
  async findAll(query: TaskFilterQuery): Promise<TaskResponseDto> {
    this.logger.log(`Fetching tasks with query: ${JSON.stringify(query)}`);
    const result = await this.tasksRepository.findAndCountTasks(query);

    const taskDtos: SingleTaskResponse[] = result.tasks.map(task => this.mapTaskEntityToDto(task));

    this.logger.verbose(`Found ${result.count} tasks matching criteria.`);
    return {
      tasks: taskDtos,
      total: result.count
    };
  }

  /**
   * Retrieves a single task by ID.
   * @throws NotFoundException if the task does not exist.
   */
  async findOne(taskId: number): Promise<TaskEntity> {
    this.logger.log(`Fetching single task by ID: ${taskId}`);
    const task = await this.tasksRepository.findOneById(taskId);

    if (!task) {
      this.logger.warn(`Task ID ${taskId} not found.`);
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }
    return task;
  }

  /**
   * Creates a new task, setting the creatorId.
   */
  async create(createTaskDto: CreateTaskDto, creatorId: number): Promise<TaskEntity> {
    this.logger.log(`Creating new task for creator ${creatorId}`);
    // FIX: Corrected operator from bitwise OR (|) to logical OR (||)
    const assignedUserId = createTaskDto.assignToUserId || null;

    if (assignedUserId) {
      const user = await this.usersRepository.findOneById(assignedUserId);
      if (!user) {
        this.logger.error(`Cannot create task: Assigned user ID ${assignedUserId} not found.`);
        throw new NotFoundException(`Assigned user ID ${assignedUserId} not found.`);
      }
    }

    const newTaskData: Partial<TaskEntity> = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      creator_id: creatorId,
      is_completed: false,
      created_at: new Date(),
      assigned_user_id: assignedUserId,
      completed_at: null,
    };
    const createdTask = await this.tasksRepository.save(newTaskData);
    this.logger.verbose(`Task created with ID: ${createdTask.task_id} by user ${creatorId}`);
    return createdTask;
  }

  /**
   * Updates an existing task's core properties.
   * NOTE: Authorization (ownership check) is handled by TaskOwnershipGuard in the Controller.
   * @throws NotFoundException if the task does not exist.
   */
  async update(taskId: number, updateTaskDto: UpdateTaskDto): Promise<TaskEntity> {
    this.logger.log(`Updating task ID: ${taskId}`);
    const existingTask = await this.tasksRepository.findOneById(taskId);
    if (!existingTask) {
      this.logger.warn(`Update failed: Task ID ${taskId} not found.`);
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    if (updateTaskDto.assignToUserId !== undefined && updateTaskDto.assignToUserId !== null) {
      const user = await this.usersRepository.findOneById(updateTaskDto.assignToUserId);
      if (!user) {
        this.logger.error(`Update failed: User ID ${updateTaskDto.assignToUserId} for assignment not found.`);
        throw new NotFoundException(`User ID ${updateTaskDto.assignToUserId} designated for assignment not found.`);
      }
    }
    else if (updateTaskDto.assignToUserId === null) {
      updateTaskDto.assignToUserId = null;
    }


    const updatePayload: Partial<TaskEntity> = {
      ...updateTaskDto,
    };

    if (updateTaskDto.isCompleted !== undefined) {
      if (updateTaskDto.isCompleted === true) {
        if (!existingTask.is_completed) {
          updatePayload.completed_at = new Date();
        }
      } else if (updateTaskDto.isCompleted === false) {
        updatePayload.completed_at = null;
      }
    }

    const updatedTask = await this.tasksRepository.update(taskId, updatePayload);
    this.logger.verbose(`Task ID ${taskId} updated successfully.`);
    return updatedTask;
  }

  /**
   * Deletes a task.
   * NOTE: Authorization (ownership check) is handled by TaskOwnershipGuard in the Controller.
   */
  async delete(taskId: number): Promise<void> {
    this.logger.log(`Attempting to delete task ID: ${taskId}`);
    const result = await this.tasksRepository.delete(taskId);

    if (result.affected === 0) {
      this.logger.warn(`Attempted to delete non-existent task ID ${taskId}.`);
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }
    this.logger.log(`Task ID ${taskId} deleted.`);
  }

  /**
   * Assigns a task to a user.
   * NOTE: Guard checks ensure the task is currently unassigned before this call.
   */
  async assign(taskId: number, assignedUserId: number): Promise<TaskEntity> {
    this.logger.log(`Assigning task ${taskId} to user ${assignedUserId}`);
    const user = await this.usersRepository.findOneById(assignedUserId);
    if (!user) {
      this.logger.error(`Assignment failed: User ${assignedUserId} does not exist.`);
      throw new NotFoundException(`User with ID ${assignedUserId} not found.`);
    }

    // Update assignment field
    const updatedTask = await this.tasksRepository.update(taskId, {
      assigned_user_id: assignedUserId,
      is_completed: false,
      completed_at: null,
    });
    this.logger.verbose(`Task ${taskId} assigned to user ${assignedUserId}.`);
    return updatedTask;
  }

  /**
   * Unassigns a task.
   * NOTE: Guard checks ensure the task is currently assigned before this call.
   */
  async unassign(taskId: number): Promise<TaskEntity> {
    this.logger.log(`Unassigning task ${taskId}.`);
    const updatedTask = await this.tasksRepository.update(taskId, {
      assigned_user_id: null,
      is_completed: false,
      completed_at: null,
    });
    this.logger.verbose(`Task ${taskId} successfully unassigned.`);
    return updatedTask;
  }

  /**
   * Marks a task as complete, setting the completion date.
   * NOTE: Guard checks ensure the task is assigned to the requester.
   */
  async markComplete(taskId: number): Promise<TaskEntity> {
    this.logger.log(`Marking task ${taskId} as complete.`);
    const updatedTask = await this.tasksRepository.update(taskId, {
      is_completed: true,
      completed_at: new Date(),
    });
    this.logger.verbose(`Task ${taskId} marked complete.`);
    return updatedTask;
  }

  /**
   * Marks a task as incomplete, clearing the completion date.
   * NOTE: Guard checks ensure the task is assigned to the requester.
   */
  async markIncomplete(taskId: number): Promise<TaskEntity> {
    this.logger.log(`Marking task ${taskId} as incomplete.`);
    const updatedTask = await this.tasksRepository.update(taskId, {
      is_completed: false,
      completed_at: null,
    });
    this.logger.verbose(`Task ${taskId} marked incomplete.`);
    return updatedTask;
  }
}
