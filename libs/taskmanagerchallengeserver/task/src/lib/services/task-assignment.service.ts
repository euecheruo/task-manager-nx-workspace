import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskAssignmentEntity } from '../entities/task-assignment.entity';
import { TaskEntity } from '../entities/task.entity';
import { UserEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/user.entity';

@Injectable()
export class TaskAssignmentService {
  constructor(
    @InjectRepository(TaskAssignmentEntity)
    private readonly assignmentRepository: Repository<TaskAssignmentEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
  ) { }

  async getAssignmentByTaskId(taskId: number): Promise<TaskAssignmentEntity | null> {
    const taskCount = await this.taskRepository.count({ where: { id: taskId } });
    if (taskCount === 0) {
      throw new NotFoundException(`Task with ID ${taskId} not found.`);
    }

    return this.assignmentRepository.findOne({
      where: { taskId },
      relations: ['assignedUser']
    });
  }

  async isTaskAssigned(taskId: number): Promise<boolean> {
    const count = await this.assignmentRepository.count({ where: { taskId } });
    return count > 0;
  }

  async getAssignmentByAssignmentId(assignmentId: number): Promise<TaskAssignmentEntity | null> {
    return this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['assignedUser', 'task'] // Load related task and user data
    });
  }

}
