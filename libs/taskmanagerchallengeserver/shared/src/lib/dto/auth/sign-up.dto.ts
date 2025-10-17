import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    description: 'The user\'s unique email address.',
    example: 'new.user@example.com',
    maxLength: 100,
  })
  @IsEmail({}, { message: 'Must be a valid email address.' })
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    description: 'The user\'s password (minimum 8 characters).',
    example: 'SecureP@ss2025',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;
}
