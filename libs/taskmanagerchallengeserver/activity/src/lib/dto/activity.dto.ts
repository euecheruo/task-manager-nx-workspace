import { ApiProperty } from '@nestjs/swagger';
import { ActivityEntity } from '../entities/activity.entity';

export class ActivityDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'TASK_CREATED' })
  actionType: string;

  @ApiProperty({ example: 101 })
  taskId: number;

  @ApiProperty({ example: 5, nullable: true })
  userId: number | null;

  @ApiProperty({ example: { title: 'New Task' } })
  details: Record<string, any> | null;

  @ApiProperty({ example: new Date() })
  createdAt: Date;

  constructor(entity: ActivityEntity) {
    this.id = entity.id!;
    this.actionType = entity.actionType;
    this.taskId = entity.taskId;
    this.userId = entity.userId;
    this.details = entity.details;
    this.createdAt = entity.createdAt!;
  }
}
