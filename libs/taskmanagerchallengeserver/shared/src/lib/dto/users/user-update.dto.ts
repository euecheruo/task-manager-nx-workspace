import {
  IsString,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserUpdateDto {
  
  @ApiProperty({ description: 'The current password (required for security verification).', example: 'OldP@ss123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({ description: 'The new password (minimum 8 characters).', required: false, example: 'NewSecureP@ss2025' })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long.' })
  newPassword?: string;

}
