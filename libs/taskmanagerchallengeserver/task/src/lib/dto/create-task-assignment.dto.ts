import { IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskAssignmentDto {

  @ApiProperty({
    description: 'The ID of the local PostgreSQL user being assigned to the task.',
    example: 8,
    minimum: 1,
    type: 'integer',
  })
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(1)
  assignedUserId?: number;
}
