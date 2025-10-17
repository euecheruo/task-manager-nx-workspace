import { DataSource, Repository, IsNull, Not } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { TaskEntity } from '../entities/task.entity';

interface TaskUpdateDto {
    title?: string;
    description?: string;
}

@Injectable()
export class TaskRepository extends Repository<TaskEntity> {
  constructor(private dataSource: DataSource) {
    super(TaskEntity, dataSource.createEntityManager());
  }

  async findAllTasks(): Promise<TaskEntity[]> {
    return this.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByIdAndCreator(taskId: number, creatorId: number): Promise<TaskEntity | null> {
    return this.findOne({
      where: { taskId, creatorId },
    });
  }

  async findUnassignedTask(taskId: number): Promise<TaskEntity | null> {
    return this.findOne({
      where: { taskId, assignedUserId: IsNull() },
    });
  }

  async findAssignedTask(taskId: number): Promise<TaskEntity | null> {
    return this.findOne({
      where: { taskId, assignedUserId: Not(IsNull()) },
    });
  }

  async updateTaskMetadata(taskId: number, updateData: TaskUpdateDto): Promise<void> {
    const fieldsToUpdate = {};
    if (updateData.title !== undefined) fieldsToUpdate['title'] = updateData.title;
    if (updateData.description !== undefined) fieldsToUpdate['description'] = updateData.description;

    if (Object.keys(fieldsToUpdate).length > 0) {
      await this.update({ taskId }, fieldsToUpdate);
    }
  }
}
