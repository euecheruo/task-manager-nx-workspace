import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {

  @ApiProperty({
    description: 'The short, required title of the task.',
    example: 'Implement AuthGuard',
    maxLength: 255,
  })

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    description: 'A detailed description of the task.',
    example: 'Set up the JwtAuthGuard to use the jwks-rsa library for token verification.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
