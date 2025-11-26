// /workspace-root/libs/api/tasks/dtos/task-filter.query.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString, IsIn } from 'class-validator';

/**
 * UPDATED: Matches the Angular frontend's TaskFilterQuery interface.
 * Query parameters for the dashboard list.
 */
export class TaskFilterQuery {
  @ApiPropertyOptional({ example: 1, description: 'Page number for pagination (defaults to 1).' })
  @IsNumberString()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page (defaults to 10).' })
  @IsNumberString()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ example: 'assigned', enum: ['all', 'assigned', 'unassigned'], description: 'Filter tasks by assignment status.' })
  @IsIn(['all', 'assigned', 'unassigned'])
  @IsOptional()
  assignmentFilter?: 'all' | 'assigned' | 'unassigned';

  @ApiPropertyOptional({ example: 'completed', enum: ['all', 'completed', 'incomplete'], description: 'Filter tasks by completion status (only used if assignmentFilter is not "unassigned").' })
  @IsIn(['all', 'completed', 'incomplete'])
  @IsOptional()
  completionFilter?: 'all' | 'completed' | 'incomplete';
}
