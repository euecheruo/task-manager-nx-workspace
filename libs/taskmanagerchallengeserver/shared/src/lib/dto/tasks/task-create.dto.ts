import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskCreateDto {
  @ApiProperty({
    description: 'The title of the task. Must be between 1 and 255 characters.',
    maxLength: 255,
    example: 'Implement RBAC authentication guards',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'A detailed description of the task.',
    required: false,
    example: 'Develop all TypeORM entities and custom repositories.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
