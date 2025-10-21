import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { TaskRepository } from '@task-manager-nx-workspace/api/data-access/lib/repositories/task.repository';
import { TaskEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/task.entity';
import { TaskCreateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-create.dto';
import { TaskUpdateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-update.dto';
import { TaskResponseDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-response.dto';
import { TaskStatusDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-status.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly taskRepository: TaskRepository,
  ) { }

  private mapToDto(task: TaskEntity): TaskResponseDto {
    return task as unknown as TaskResponseDto;
  }

  async findAllTasks(): Promise<TaskResponseDto[]> {
    const tasks = await this.taskRepository.find();
    return tasks.map(this.mapToDto);
  }

  async createTask(dto: TaskCreateDto, creatorId: number): Promise<TaskResponseDto> {
    const newTask = this.taskRepository.create({
      ...dto,
      creatorId: creatorId,
      isCompleted: false,
    });
    const savedTask = await this.taskRepository.save(newTask);
    return this.mapToDto(savedTask);
  }

  async updateOwnTask(
    taskId: number,
    userId: number,
    dto: TaskUpdateDto
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOneBy({ taskId });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    if (task.creatorId !== userId) {
      throw new ForbiddenException('You can only update tasks that you created.');
    }

    await this.taskRepository.update(taskId, dto);
    const updatedTask = await this.taskRepository.findOneBy({ taskId });
    return this.mapToDto(updatedTask);
  }

  async deleteOwnTask(taskId: number, userId: number): Promise<void> {
    const task = await this.taskRepository.findOneBy({ taskId });
    if (!task) {
      return;
    }

    if (task.creatorId !== userId) {
      throw new ForbiddenException('You can only delete tasks that you created.');
    }

    await this.taskRepository.delete(taskId);
  }

  async assignTask(taskId: number, assignedUserId: number): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOneBy({ taskId });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    if (task.assignedUserId !== null) {
      throw new BadRequestException('Task is already assigned. Please unassign it first.');
    }

    await this.taskRepository.update(taskId, { assignedUserId });
    const assignedTask = await this.taskRepository.findOneBy({ taskId });
    return this.mapToDto(assignedTask);
  }

  async unassignTask(taskId: number): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOneBy({ taskId });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    if (task.assignedUserId === null) {
      throw new BadRequestException('Task is already unassigned.');
    }

    await this.taskRepository.update(taskId, { assignedUserId: null, isCompleted: false });
    const unassignedTask = await this.taskRepository.findOneBy({ taskId });
    return this.mapToDto(unassignedTask);
  }

  async markTaskCompleted(
    taskId: number,
    userId: number,
    statusDto: TaskStatusDto
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOneBy({ taskId });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    if (task.assignedUserId !== userId) {
      throw new ForbiddenException('You can only mark tasks assigned to you as complete.');
    }

    if (task.isCompleted) {
      throw new BadRequestException('Task is already completed.');
    }

    await this.taskRepository.update(taskId, {
      isCompleted: true,
    });
    const completedTask = await this.taskRepository.findOneBy({ taskId });
    return this.mapToDto(completedTask);
  }

  async markTaskIncomplete(
    taskId: number,
    userId: number,
    statusDto: TaskStatusDto
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOneBy({ taskId });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    if (task.assignedUserId !== userId) {
      throw new ForbiddenException('You can only unmark tasks assigned to you.');
    }

    if (!task.isCompleted) {
      throw new BadRequestException('Task is already incomplete.');
    }

    await this.taskRepository.update(taskId, {
      isCompleted: false,
    });
    const incompleteTask = await this.taskRepository.findOneBy({ taskId });
    return this.mapToDto(incompleteTask);
  }
}
