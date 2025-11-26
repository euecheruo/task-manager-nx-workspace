import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEmail, IsDate } from 'class-validator';

/**
 * DTO representing the non-sensitive profile information of a user.
 * Used for the /users/me endpoint and the list of all users.
 */
export class UserProfileDto {
  @ApiProperty({ example: 1, description: 'Unique identifier of the user.' })
  @IsNumber()
  userId!: number;

  @ApiProperty({ example: 'test@example.com', description: 'User email address.' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '2024-01-01T10:00:00Z', description: 'Date the user account was created.' })
  @IsDate()
  createdAt!: Date;
}
