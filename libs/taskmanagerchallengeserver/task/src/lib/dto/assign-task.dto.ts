import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTaskDto {

  @ApiProperty({
    example: 5,
    description: 'The internal PostgreSQL ID of the user to assign the task to.'
  })
  @IsInt()
  @IsNotEmpty()
  assignedUserId: number;

  constructor(assignedUserId: number) {
    this.assignedUserId = assignedUserId;
  }
}
