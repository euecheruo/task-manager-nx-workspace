import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString, IsIn } from 'class-validator';

export class TaskFilterQuery {
  @ApiPropertyOptional({ example: 1, description: 'Page number for pagination (defaults to 1).' })
  @IsNumberString()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page (defaults to 10).' })
  @IsNumberString()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 'assigned', enum: ['all', 'completed', 'assigned', 'unassigned'], description: 'Filter tasks by status.' })
  @IsIn(['all', 'completed', 'assigned', 'unassigned'])
  @IsOptional()
  filter?: 'all' | 'completed' | 'assigned' | 'unassigned';
}
