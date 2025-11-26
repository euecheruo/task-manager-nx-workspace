import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsOptional, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UserProfileDto } from '../../../../users/src/lib/dtos/user-profile.dto';

export class SingleTaskResponse {
  @ApiProperty({ example: 101, description: 'Unique identifier of the task.' })
  @IsNumber()

  taskId!: number;

  @ApiProperty({ example: 'Refactor Auth Module', description: 'Title of the task.' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Detailed description.', type: 'string' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1, description: 'ID of the user who created the task.' })
  @IsNumber()
  creatorId!: number;

  @ApiProperty({ type: UserProfileDto, description: 'The user who created the task.' })
  @ValidateNested()
  @Type(() => UserProfileDto)
  creator!: UserProfileDto;

  @ApiPropertyOptional({ example: 5, description: 'ID of the user currently assigned, or null if unassigned.' })
  @IsNumber()
  @IsOptional()
  assignedUserId?: number | null;

  @ApiPropertyOptional({ type: UserProfileDto, nullable: true, description: 'The user currently assigned to the task (if assigned).' })
  @ValidateNested()
  @Type(() => UserProfileDto)
  @IsOptional()
  assignedUser!: UserProfileDto | null;

  @ApiProperty({ example: false, description: 'Completion status of the task.' })
  @IsBoolean()
  isCompleted!: boolean;

  @ApiProperty({ example: '2025-10-24T10:00:00Z', description: 'Date the task was created.' })
  @IsDateString()
  createdAt!: Date;

  @ApiPropertyOptional({ example: '2025-10-25T15:30:00Z', description: 'Date the task was completed (if applicable).' })
  @IsDateString()
  @IsOptional()
  completedAt?: Date | null;
}

export class TaskResponseDto {
  @ApiProperty({ type: [SingleTaskResponse], description: 'Array of tasks returned by the query.' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleTaskResponse)
  tasks!: SingleTaskResponse[];

  @ApiProperty({ example: 50, description: 'Total number of tasks matching the query without pagination.' })
  @IsNumber()
  total!: number;

  @ApiProperty({ example: 1, description: 'The current page number returned.' })
  @IsNumber()
  page!: number;

  @ApiProperty({ example: 10, description: 'The number of tasks per page (limit).' })
  @IsNumber()
  limit!: number;
}
