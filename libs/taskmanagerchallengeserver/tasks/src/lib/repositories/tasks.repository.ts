import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { TaskEntity } from '../../../../data-access/src/lib/entities/task.entity';
import { TaskFilterQuery } from '../dtos/task-filter.query';

interface TaskFindResult {
  tasks: TaskEntity[];
  count: number;
}

@Injectable()
export class TasksRepository {
  private readonly logger = new Logger(TasksRepository.name);

  constructor(
    @InjectRepository(TaskEntity)
    private tasksRepository: Repository<TaskEntity>,
  ) { }

  /**
   * Finds tasks based on filter/pagination criteria and returns the total count.
   * Ensures all fields required for SingleTaskResponse mapping are selected.
   */
  async findAndCountTasks(query: TaskFilterQuery): Promise<TaskFindResult> {
    const { page = 1, limit = 10, assignmentFilter = 'all', completionFilter = 'all' } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const currentLimit = Number(limit);

    const queryBuilder = this.tasksRepository.createQueryBuilder('task');

    if (assignmentFilter === 'assigned') {
      queryBuilder.andWhere('task.assigned_user_id IS NOT NULL');
    } else if (assignmentFilter === 'unassigned') {
      queryBuilder.andWhere('task.assigned_user_id IS NULL');
    }

    if (assignmentFilter !== 'unassigned' && completionFilter !== 'all') {
      if (completionFilter === 'completed') {
        queryBuilder.andWhere('task.is_completed = :isCompleted', { isCompleted: true });
      } else if (completionFilter === 'incomplete') {
        queryBuilder.andWhere('task.is_completed = :isCompleted', { isCompleted: false });
      }
    }

    queryBuilder.orderBy('task.created_at', 'DESC');


    queryBuilder.skip(skip).take(currentLimit);

    const [tasks, count] = await queryBuilder
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignedUser', 'assignedUser')
      .getManyAndCount();

    this.logger.verbose(`DB operation: Fetched ${tasks.length}/${count} tasks (Page ${page}).`);

    return { tasks, count };
  }

  /**
   * Finds a single task by its primary key.
   */
  async findOneById(taskId: number): Promise<TaskEntity | null> {
    this.logger.debug(`DB lookup: find task by ID ${taskId}`);
    return await this.tasksRepository.findOne({
      where: { task_id: taskId as any },
      relations: ['creator', 'assignedUser']
    });
  }

  /**
   * Finds a task by its title. Used for duplicate checking.
   */
  async findOneByTitle(title: string): Promise<TaskEntity | null> {
    return await this.tasksRepository.findOne({
      where: { title },
    });
  }

  /**
   * Saves a new task entity (create/insert).
   */
  async save(taskData: Partial<TaskEntity>): Promise<TaskEntity> {
    this.logger.debug(`DB write: saving new task.`);
    return await this.tasksRepository.save(taskData);
  }

  /**
   * Updates an existing task entity.
   * Returns the updated entity fetched after the update operation.
   */
  async update(taskId: number, updatePayload: Partial<TaskEntity>): Promise<TaskEntity> {
    this.logger.debug(`DB update: updating task ID ${taskId}`);

    const result: UpdateResult = await this.tasksRepository.update(
      { task_id: taskId },
      updatePayload,
    );

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${taskId} not found for update.`);
    }

    const updatedTask = await this.findOneById(taskId);
    if (!updatedTask) {
      throw new NotFoundException(`Updated task ID ${taskId} disappeared.`);
    }

    return updatedTask;
  }

  /**
   * Deletes a task by ID.
   * Returns DeleteResult (which includes affected count).
   */
  async delete(
    taskId: number,
  ): Promise<{ affected?: number | null | undefined }> {
    this.logger.debug(`DB delete: deleting task ID ${taskId}`);
    const result: DeleteResult = await this.tasksRepository.delete(taskId);

    return { affected: result.affected };
  }
}
