import {
  IsNumber,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskAssignDto {
  @ApiProperty({
    description: 'The ID of the user to assign the task to. Use null to unassign the task.',
    required: true,
    nullable: true,
    example: 5,
  })

  @IsOptional()
  @ValidateIf((object, value) => value !== null)
  @IsNumber({}, { message: 'Assigned user ID must be a number or null.' })
  assignedUserId: number | null;
}
