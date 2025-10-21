import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

export class TaskResponseDto {

  @ApiProperty({ description: 'Unique identifier for the task.', example: 1 })
  @IsInt()
  @IsNotEmpty()
  taskId: number;

  @ApiProperty({ description: 'The title of the task.', example: 'Implement RBAC Guard' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of the task.', example: 'Fix circular dependencies and implement TypeORM existence check.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Indicates whether the task is complete.', example: false })
  @IsBoolean()
  @IsNotEmpty()
  isCompleted: boolean;

  @ApiProperty({ description: 'ID of the user who created the task (Task Creator).', example: 101 })
  @IsInt()
  @IsNotEmpty()
  creatorId: number;

  @ApiProperty({ description: 'ID of the user currently assigned to the task, or null if unassigned.', example: 102, nullable: true })
  @IsInt()
  @IsOptional()
  assignedUserId: number | null;

  @ApiProperty({ description: 'Timestamp when the task was created.', example: new Date() })
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when the task was last updated.', example: new Date() })
  @IsDate()
  updatedAt: Date;
}
