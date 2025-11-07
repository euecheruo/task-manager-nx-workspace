import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login screen', description: 'Title of the task.' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Design and build the Angular login component.', description: 'Detailed description of the task.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 4, description: 'ID of the user to whom the task should be assigned (optional).' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  assignToUserId?: number;
}
