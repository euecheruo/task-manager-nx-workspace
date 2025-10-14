import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({ example: 'TASK_ASSIGNED', description: 'The type of action performed.' })
  @IsString()
  @IsNotEmpty()
  actionType?: string;

  @ApiProperty({ example: 101, description: 'The ID of the task affected.' })
  @IsInt()
  @IsNotEmpty()
  taskId?: number;

  @ApiProperty({ example: 5, description: 'The ID of the user who performed the action.', required: false })
  @IsInt()
  @IsOptional()
  userId?: number | null;

  @ApiProperty({ description: 'Detailed payload of the change (e.g., assignedTo: 5)', required: false })
  @IsOptional()
  details?: Record<string, any> | null;
}
