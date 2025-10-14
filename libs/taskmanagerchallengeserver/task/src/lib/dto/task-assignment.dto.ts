import { ApiProperty } from '@nestjs/swagger';

export class TaskAssignmentDto {

  @ApiProperty({
    description: 'The unique primary identifier of the task assignment record.',
    example: 25,
  })
  id?: number;

  @ApiProperty({
    description: 'The ID of the task that is assigned.',
    example: 101,
  })
  taskId?: number;

  @ApiProperty({
    description: 'The ID of the local PostgreSQL user assigned to the task. Null if unassigned.',
    example: 7,
    nullable: true
  })
  assignedUserId?: number | null;


  @ApiProperty({
    description: 'Timestamp when the assignment was created or last updated.',
    example: '2025-10-13T12:00:00.000Z',
  })
  assignedAt?: Date;

  @ApiProperty({
    description: 'Timestamp when the assignment record was created.',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Timestamp when the assignment record was last updated.',
    example: '2025-01-05T10:00:00.000Z',
  })
  updatedAt?: Date;

  constructor(partial: Partial<TaskAssignmentDto>) {
    Object.assign(this, partial);
  }
}
