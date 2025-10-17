import {
  IsString,
  MaxLength,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskUpdateDto {
  @ApiProperty({
    description: 'The new title of the task.',
    maxLength: 255,
    required: false,
    example: 'Finalize RBAC configuration (updated)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'The new detailed description of the task.',
    required: false,
    example: 'Ensure all guards and strategies are properly implemented.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The user ID to assign the task to. Set to null to unassign.',
    required: false,
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  assignedUserId?: number | null;
  
  @ApiProperty({
    description: 'The completion status of the task.',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
