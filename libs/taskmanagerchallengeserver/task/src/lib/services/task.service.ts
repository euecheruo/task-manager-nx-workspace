import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import { TaskAssignmentEntity } from '../entities/task-assignment.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { AssignTaskDto } from '../dto/assign-task.dto';
import { AuthService } from '@task-manager-nx-workspace/shared/auth/lib/services/auth.service';
import { ActivityService } from '@task-manager-nx-workspace/activity/lib/services/activity.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(TaskAssignmentEntity)
    private readonly assignmentRepository: Repository<TaskAssignmentEntity>,
    private readonly authService: AuthService,
    private readonly activityService: ActivityService,
  ) { }

  /**
   * @description Creates a new task and logs the activity.
   * Permission: 'create:tasks'
   */
  async create(dto: CreateTaskDto, creatorUserId: number): Promise<TaskEntity> {
    const task = new TaskEntity(dto.title, creatorUserId, dto.description, false);

    const newTask = await this.taskRepository.save(task);

    // Log Activity
    await this.activityService.create({
      actionType: 'TASK_CREATED',
      taskId: newTask.id!,
      userId: creatorUserId,
      details: { title: newTask.title },
    });

    return newTask;
  }

  /**
   * @description Retrieves all tasks, optionally filtering by completion status.
   * Permission: 'read:tasks'
   */
  async findAll(isCompleted?: boolean): Promise<TaskEntity[]> {
    const query: any = { relations: ['creator', 'assignment', 'assignment.assignedUser'] };
    if (isCompleted !== undefined) {
      query.where = { isCompleted };
    }
    return this.taskRepository.find(query);
  }

  async findOne(taskId: number): Promise<TaskEntity> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['creator', 'assignment', 'assignment.assignedUser'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }
    return task;
  }

  /**
   * @description Updates a task, restricted to the creator only.
   * Permission: 'update:own:tasks'
   */
  async updateOwn(taskId: number, dto: UpdateTaskDto, requesterUserId: number): Promise<TaskEntity> {
    const task = await this.findOne(taskId);

    if (task.creatorUserId !== requesterUserId) {
      throw new ForbiddenException('You can only update tasks you created.');
    }

    task.title = dto.title ?? task.title;
    task.description = dto.description ?? task.description;

    const updatedTask = await this.taskRepository.save(task);

    // Log Activity
    await this.activityService.create({
      actionType: 'TASK_UPDATED',
      taskId: updatedTask.id!,
      userId: requesterUserId,
      details: { fields: Object.keys(dto) },
    });

    return updatedTask;
  }

  /**
   * @description Deletes a task, restricted to the creator only.
   * Permission: 'delete:own:tasks'
   */
  async deleteOwn(taskId: number, requesterUserId: number): Promise<void> {
    const task = await this.findOne(taskId);

    // 🔑 Ownership Check (Permission Enforcement)
    if (task.creatorUserId !== requesterUserId) {
      throw new ForbiddenException('You can only delete tasks you created.');
    }

    // Deletion automatically cascades to TaskAssignment due to entity definition
    const result = await this.taskRepository.delete(taskId);

    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    // Log Activity
    await this.activityService.create({
      actionType: 'TASK_DELETED',
      taskId: taskId,
      userId: requesterUserId,
      details: { title: task.title },
    });
  }

  /**
   * @description Assigns an unassigned task to a user.
   * Permission: 'assign:tasks'
   */
  async assignTask(taskId: number, dto: AssignTaskDto, requesterUserId: number): Promise<TaskAssignmentEntity> {
    const task = await this.findOne(taskId);

    if (task.assignment) {
      throw new ForbiddenException('Task is already assigned.');
    }

    // 🔑 TaskAssignmentEntity constructor requires: taskId, assignedUserId
    const assignment = new TaskAssignmentEntity(taskId, dto.assignedUserId);
    const newAssignment = await this.assignmentRepository.save(assignment);

    // Log Activity
    await this.activityService.create({
      actionType: 'TASK_ASSIGNED',
      taskId: taskId,
      userId: requesterUserId,
      details: { assignedToUserId: dto.assignedUserId },
    });

    return newAssignment;
  }

  /**
   * @description Unassigns a task from any user.
   * Permission: 'unassign:tasks'
   */
  async unassignTask(taskId: number, requesterUserId: number): Promise<void> {
    const task = await this.findOne(taskId);

    if (!task.assignment) {
      throw new NotFoundException('Task is not currently assigned.');
    }

    // Delete the assignment record
    await this.assignmentRepository.delete({ taskId });

    // Log Activity
    await this.activityService.create({
      actionType: 'TASK_UNASSIGNED',
      taskId: taskId,
      userId: requesterUserId,
      details: { wasAssignedTo: task.assignment.assignedUserId },
    });
  }

  /**
   * @description Marks a task assigned to the user as complete/incomplete.
   * Permissions: 'mark:assigned:tasks', 'unmark:assigned:tasks'
   */
  async toggleComplete(taskId: number, isCompleted: boolean, requesterUserId: number): Promise<TaskEntity> {
    const task = await this.findOne(taskId);

    // Check if the task is assigned to the requesting user
    if (task.assignment?.assignedUserId !== requesterUserId) {
      throw new ForbiddenException('You can only complete/incomplete tasks assigned to you.');
    }

    // Prevent unnecessary database write if state hasn't changed
    if (task.isCompleted === isCompleted) {
      return task;
    }

    task.isCompleted = isCompleted;
    const updatedTask = await this.taskRepository.save(task);

    // Determine action type for logging
    const actionType = isCompleted ? 'TASK_COMPLETED' : 'TASK_INCOMPLETED';

    // Log Activity
    await this.activityService.create({
      actionType: actionType,
      taskId: taskId,
      userId: requesterUserId,
      details: { status: isCompleted ? 'Completed' : 'Incompleted' },
    });

    return updatedTask;
  }
}
