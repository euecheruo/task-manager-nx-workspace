import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ description: 'The unique ID of the user.', example: 5 })
  userId: number;

  @ApiProperty({ description: 'The user\'s email address.', example: 'editor_alice@tasks.com' })
  email: string;

  @ApiProperty({ description: 'The timestamp when the account was created.', example: '2023-10-25T10:00:00.000Z' })
  createdAt: Date;
}
