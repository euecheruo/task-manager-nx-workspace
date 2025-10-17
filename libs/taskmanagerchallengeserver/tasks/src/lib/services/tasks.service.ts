import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import { TaskCreateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-create.dto';
import { TaskUpdateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-update.dto';
import { TaskData } from '@task-manager-nx-workspace/api/shared/lib/interfaces/tasks/task-data.interface';
import { UsersService } from '@task-manager-nx-workspace/api/users/lib/services/users.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private tasksRepository: Repository<TaskEntity>,
    private usersService: UsersService,
  ) { }

  private mapToTaskData(entity: TaskEntity): TaskData {
    return {
      taskId: entity.taskId,
      title: entity.title,
      description: entity.description,
      createdAt: entity.createdAt,
      creatorId: entity.creatorId,
      assignedUserId: entity.assignedUserId,
      isCompleted: entity.isCompleted,
      completedAt: entity.completedAt,
    };
  }

  async create(createTaskDto: TaskCreateDto, creatorId: number): Promise<TaskData> {
    try {
      const task = this.tasksRepository.create({
        ...createTaskDto,
        creatorId,
        isCompleted: false,
      });
      const savedTask = await this.tasksRepository.save(task);
      return this.mapToTaskData(savedTask);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create task.');
    }
  }

  async findAll(): Promise<TaskData[]> {
    const tasks = await this.tasksRepository.find();
    return tasks.map(this.mapToTaskData);
  }

  async update(taskId: number, userId: number, updateTaskDto: TaskUpdateDto): Promise<TaskData> {
    const task = await this.tasksRepository.findOne({ where: { taskId } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    if (task.creatorId !== userId) {
      throw new ForbiddenException('You can only update tasks that you created.');
    }

    if (updateTaskDto.assignedUserId !== undefined) {
      throw new BadRequestException('Use the dedicated /assign endpoint to change task assignment.');
    }

    const updatedTask = await this.tasksRepository.save({ ...task, ...updateTaskDto });
    return this.mapToTaskData(updatedTask);
  }

  async remove(taskId: number, userId: number): Promise<void> {
    const task = await this.tasksRepository.findOne({ where: { taskId } });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    if (task.creatorId !== userId) {
      throw new ForbiddenException('You can only delete tasks that you created.');
    }

    await this.tasksRepository.delete(taskId);
  }

  async assignTask(taskId: number, assignedUserId: number): Promise<TaskData> {
    const task = await this.tasksRepository.findOne({ where: { taskId } });

    if (!task) throw new NotFoundException(`Task ID ${taskId} not found.`);
    if (task.assignedUserId !== null) throw new BadRequestException('Task is already assigned. Unassign it first.');

    const userExists = await this.usersService.findUserById(assignedUserId);
    if (!userExists) throw new NotFoundException(`User ID ${assignedUserId} not found.`);

    task.assignedUserId = assignedUserId;
    const updatedTask = await this.tasksRepository.save(task);
    return this.mapToTaskData(updatedTask);
  }

  async unassignTask(taskId: number): Promise<TaskData> {
    const task = await this.tasksRepository.findOne({ where: { taskId } });

    if (!task) throw new NotFoundException(`Task ID ${taskId} not found.`);
    if (task.assignedUserId === null) throw new BadRequestException('Task is already unassigned.');

    task.assignedUserId = null;
    const updatedTask = await this.tasksRepository.save(task);
    return this.mapToTaskData(updatedTask);
  }

  async markAsCompleted(taskId: number, userId: number): Promise<TaskData> {
    const task = await this.tasksRepository.findOne({ where: { taskId } });

    if (!task) throw new NotFoundException(`Task ID ${taskId} not found.`);
    if (task.assignedUserId !== userId) throw new ForbiddenException('You can only mark tasks assigned to you as complete.');
    if (task.isCompleted) throw new BadRequestException('Task is already completed.');

    task.isCompleted = true;
    task.completedAt = new Date();
    const updatedTask = await this.tasksRepository.save(task);
    return this.mapToTaskData(updatedTask);
  }

  async markAsIncomplete(taskId: number, userId: number): Promise<TaskData> {
    const task = await this.tasksRepository.findOne({ where: { taskId } });

    if (!task) throw new NotFoundException(`Task ID ${taskId} not found.`);
    if (task.assignedUserId !== userId) throw new ForbiddenException('You can only unmark tasks assigned to you as incomplete.');
    if (!task.isCompleted) throw new BadRequestException('Task is already incomplete.');

    task.isCompleted = false;
    task.completedAt = null;
    const updatedTask = await this.tasksRepository.save(task);
    return this.mapToTaskData(updatedTask);
  }
}
