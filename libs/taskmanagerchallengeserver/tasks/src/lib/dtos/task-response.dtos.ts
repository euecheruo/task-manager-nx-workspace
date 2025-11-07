import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { TaskEntity } from '../../../../data-access/src/lib/entities/task.entity';

export class SingleTaskResponse {
  @ApiProperty({ example: 101, description: 'Unique identifier of the task.' })
  @IsNumber()
  taskId: number;

  @ApiProperty({ example: 'Refactor Auth Module', description: 'Title of the task.' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description.', type: 'string' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, description: 'ID of the user who created the task.' })
  @IsNumber()
  creatorId: number;

  @ApiPropertyOptional({ example: 5, description: 'ID of the user currently assigned, or null if unassigned.' })
  @IsNumber()
  @IsOptional()
  assignedUserId?: number | null;

  @ApiProperty({ example: false, description: 'Completion status of the task.' })
  @IsBoolean()
  isCompleted: boolean;

  @ApiProperty({ example: '2025-10-24T10:00:00Z', description: 'Date the task was created.' })
  @IsDateString()
  createdAt: Date;

  @ApiPropertyOptional({ example: '2025-10-25T15:30:00Z', description: 'Date the task was completed (if applicable).' })
  @IsDateString()
  @IsOptional()
  completedAt?: Date | null;
}

export class TaskResponseDto {
  @ApiProperty({ example: [SingleTaskResponse], description: 'Array of tasks returned by the query.' })
  @IsArray()
  tasks: SingleTaskResponse[];

  @ApiProperty({ example: 50, description: 'Total number of tasks matching the query without pagination.' })
  @IsNumber()
  total: number;
}
