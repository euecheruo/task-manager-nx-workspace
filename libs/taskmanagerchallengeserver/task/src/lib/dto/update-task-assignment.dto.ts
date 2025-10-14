import { IsOptional, IsInt, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTaskAssignmentDto {

  @ApiPropertyOptional({
    description: 'The ID of the user to whom the task is being assigned. Set to null (or omit) to unassign the task.',
    example: 7,
    minimum: 1,
    type: 'integer',
    nullable: true
  })
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  assignedUserId?: number | null;
}
