import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, Min } from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Implement secure JWT refresh flow', description: 'New title of the task.' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Ensure token rotation logic works.', description:
  'New detailed description of the task.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Marks the task as complete or incomplete.' })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @ApiPropertyOptional({ example: 2, description: 'ID of the user to assign the task to (optional).' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  assignToUserId?: number | null;
}
