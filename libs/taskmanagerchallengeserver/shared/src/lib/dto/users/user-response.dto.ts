import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user account.',
    example: 1,
    type: 'integer',
  })
  readonly userId: number;

  @ApiProperty({
    description: 'The unique email address of the user.',
    example: 'user.active@example.com',
  })
  readonly email: string;

  @ApiProperty({
    description: 'Timestamp when the user account was created.',
    example: '2023-10-26T10:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  readonly createdAt: Date;
}
