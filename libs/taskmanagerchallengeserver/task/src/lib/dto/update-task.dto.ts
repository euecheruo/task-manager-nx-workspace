import { IsString, IsOptional, MaxLength, IsBoolean, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskDto {

  @ApiPropertyOptional({
    description: 'The updated title of the task.',
    example: 'Refactor AuthGuard logic',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'The updated detailed description of the task.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Flag indicating whether the task is complete.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when the task was completed. Should only be set if isCompleted is true.',
    example: new Date().toISOString(),
    type: String,
    format: 'date-time'
  })
  @IsOptional()
  @IsDate()
  completedAt?: Date;
}
