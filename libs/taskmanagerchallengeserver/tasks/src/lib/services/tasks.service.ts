import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from '../dtos/create-task.dtos';
import { UpdateTaskDto } from '../dtos/update-task.dtos';
import { TaskFilterQuery } from '../dtos/task-filter.query';
import { SingleTaskResponse, TaskResponseDto } from '../dtos/task-response.dtos';
import { TasksRepository } from '../repositories/tasks.repository';
import { UsersRepository } from '../../../../users/src/lib/repositories/users.repository';
import { TaskEntity } from '../../../../data-access/src/lib/entities/task.entity';
import { UserEntity } from '../../../../data-access/src/lib/entities/user.entity';
import { UserProfileDto } from '../../../../users/src/lib/dtos/user-profile.dto';


@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private tasksRepository: TasksRepository,
    private usersRepository: UsersRepository,
  ) { }

  /**
   * Utility function to map a UserEntity (with minimal fields) to UserProfileDto.
   */
  private mapUserEntityToProfileDto(entity: UserEntity): UserProfileDto {
    return {
      userId: entity.userId,
      email: entity.email,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Utility function to map TaskEntity (DB structure) including relations to SingleTaskResponse (API DTO structure).
   */
  private mapTaskEntityToDto(entity: TaskEntity): SingleTaskResponse {
    const creatorProfile = entity.creator ? this.mapUserEntityToProfileDto(entity.creator) : null;
    const assignedUserProfile = entity.assignedUser ? this.mapUserEntityToProfileDto(entity.assignedUser) : null;

    if (!creatorProfile) {
      this.logger.error(`Task ${entity.task_id} missing creator relation!`);
      throw new Error('Task entity missing required creator relation.');
    }

    return {
      taskId: entity.task_id,
      title: entity.title,
      description: entity.description,
      creatorId: entity.creator_id,
      creator: creatorProfile,
      assignedUserId: entity.assigned_user_id,
      assignedUser: assignedUserProfile,
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

    const { page = 1, limit = 10 } = query;

    const result = await this.tasksRepository.findAndCountTasks(query);

    const taskDtos: SingleTaskResponse[] = result.tasks.map(task => this.mapTaskEntityToDto(task));
    this.logger.verbose(`Found ${result.count} tasks matching criteria.`);

    return {
      tasks: taskDtos,
      total: result.count,
      page: Number(page),
      limit: Number(limit),
    };
  }

  /**
   * Retrieves a single task by ID.
   * @throws NotFoundException if the task does not exist.
   */
  async findOne(taskId: number): Promise<SingleTaskResponse> {
    this.logger.log(`Fetching single task by ID: ${taskId}`);
    const task = await this.tasksRepository.findOneById(taskId);

    if (!task) {
      this.logger.warn(`Task ID ${taskId} not found.`);
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    return this.mapTaskEntityToDto(task);
  }

  /**
   * Creates a new task, sets the creatorId, and returns the full DTO.
   * @returns SingleTaskResponse DTO
   */
  async create(createTaskDto: CreateTaskDto, creatorId: number): Promise<SingleTaskResponse> {
    this.logger.log(`Creating new task for creator ${creatorId}`);

    const existingTitle = await this.tasksRepository.findOneByTitle(createTaskDto.title);
    if (existingTitle) {
      throw new ConflictException(`A task with the title '${createTaskDto.title}' already exists.`);
    }

    const assignedUserId = createTaskDto.assignedUserId || null;

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

    return this.findOne(createdTask.task_id);
  }

  /**
   * Updates an existing task's core properties and returns the full DTO.
   * @returns SingleTaskResponse DTO
   */
  async update(taskId: number, updateTaskDto: UpdateTaskDto): Promise<SingleTaskResponse> {
    this.logger.log(`Updating task ID: ${taskId}`);
    const existingTask = await this.tasksRepository.findOneById(taskId);
    if (!existingTask) {
      this.logger.warn(`Update failed: Task ID ${taskId} not found.`);
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    if (updateTaskDto.title && updateTaskDto.title !== existingTask.title) {
      const duplicateCheck = await this.tasksRepository.findOneByTitle(updateTaskDto.title);
      if (duplicateCheck) {
        throw new ConflictException(`A task with the title '${updateTaskDto.title}' already exists.`);
      }
    }

    if (updateTaskDto.assignedUserId !== undefined) {
      const assignedUserId = updateTaskDto.assignedUserId;

      if (assignedUserId !== null) {
        const user = await this.usersRepository.findOneById(assignedUserId);
        if (!user) {
          this.logger.error(`Update failed: User ID ${assignedUserId} for assignment not found.`);
          throw new NotFoundException(`User ID ${assignedUserId} designated for assignment not found.`);
        }
      }
    }

    const updatePayload: Partial<TaskEntity> = {
      title: updateTaskDto.title,
      description: updateTaskDto.description,
      is_completed: updateTaskDto.isCompleted,
      ...(updateTaskDto.assignedUserId !== undefined && { assigned_user_id: updateTaskDto.assignedUserId }),
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

    return this.findOne(updatedTask.task_id);
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
   * Assigns a task to a user and returns the full DTO.
   */
  async assign(taskId: number, assignedUserId: number): Promise<SingleTaskResponse> {
    this.logger.log(`Assigning task ${taskId} to user ${assignedUserId}`);

    const user = await this.usersRepository.findOneById(assignedUserId);
    if (!user) {
      this.logger.error(`Assignment failed: User ${assignedUserId} does not exist.`);
      throw new NotFoundException(`User with ID ${assignedUserId} not found.`);
    }


    const updatedTask = await this.tasksRepository.update(taskId, {
      assigned_user_id: assignedUserId,
      is_completed: false,
      completed_at: null,
    });
    this.logger.verbose(`Task ${taskId} assigned to user ${assignedUserId}.`);
    return this.findOne(updatedTask.task_id);
  }

  /**
   * Unassigns a task and returns the full DTO.
   */
  async unassign(taskId: number): Promise<SingleTaskResponse> {
    this.logger.log(`Unassigning task ${taskId}.`);

    const updatedTask = await this.tasksRepository.update(taskId, {
      assigned_user_id: null,
      is_completed: false,
      completed_at: null,
    });
    this.logger.verbose(`Task ${taskId} successfully unassigned.`);
    return this.findOne(updatedTask.task_id);
  }

  /**
   * Marks a task as complete, setting the completion date, and returns the full DTO.
   */
  async markComplete(taskId: number): Promise<SingleTaskResponse> {
    this.logger.log(`Marking task ${taskId} as complete.`);
    const updatedTask = await this.tasksRepository.update(taskId, {
      is_completed: true,
      completed_at: new Date(),
    });
    this.logger.verbose(`Task ${taskId} marked complete.`);
    return this.findOne(updatedTask.task_id);
  }

  /**
   * Marks a task as incomplete, clearing the completion date, and returns the full DTO.
   */
  async markIncomplete(taskId: number): Promise<SingleTaskResponse> {
    this.logger.log(`Marking task ${taskId} as incomplete.`);
    const updatedTask = await this.tasksRepository.update(taskId, {
      is_completed: false,
      completed_at: null,
    });
    this.logger.verbose(`Task ${taskId} marked incomplete.`);
    return this.findOne(updatedTask.task_id);
  }
}
