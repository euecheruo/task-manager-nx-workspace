import {
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskStatusDto {
  @ApiProperty({
    description: 'The desired completion status of the task. True marks it complete (mark:assigned:tasks); false marks it incomplete (unmark:assigned:tasks).',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isCompleted: boolean;
}
