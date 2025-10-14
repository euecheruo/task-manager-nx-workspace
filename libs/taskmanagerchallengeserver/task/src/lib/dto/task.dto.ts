import { ApiProperty } from '@nestjs/swagger';

export class TaskDto {

  @ApiProperty({
    description: 'The unique primary identifier of the task.',
    example: 101,
  })
  id?: number;

  @ApiProperty({
    description: 'The task title.',
    example: 'Set up Auth0 JWKS endpoint.',
  })
  title?: string;

  @ApiProperty({
    description: 'A detailed description of the task.',
    required: false,
    example: 'Ensure jwks-rsa is configured in the JwtStrategy.',
  })
  description?: string | null;

  @ApiProperty({
    description: 'The ID of the user who created the task (local PostgreSQL ID).',
    example: 5,
  })
  creatorId?: number;

  @ApiProperty({
    description: 'Whether the task has been completed.',
    example: false,
  })
  isCompleted?: boolean;

  @ApiProperty({
    description: 'Timestamp when the task was created.',
    example: '2025-10-13T12:00:00.000Z',
  })
  createdAt?: Date;

  @ApiProperty({
    description: 'Timestamp of the last update.',
    example: '2025-10-13T12:00:00.000Z',
  })
  updatedAt?: Date;

  @ApiProperty({
    description: 'Timestamp when the task was completed, if applicable.',
    required: false,
    example: '2025-10-14T12:00:00.000Z',
  })
  completedAt?: Date | null;

  constructor(partial: Partial<TaskDto>) {
    Object.assign(this, partial);
  }
}
