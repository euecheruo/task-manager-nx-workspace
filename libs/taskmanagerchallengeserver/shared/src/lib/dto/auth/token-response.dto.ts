import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, MinLength, IsInt } from 'class-validator';

export class TokenResponseDto {
  @ApiProperty({
    description: 'The JSON Web Token (JWT) used for subsequent API requests (Bearer Token).',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    description: 'The refresh token, a long-lived opaque token used to obtain a new access token.',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(64)
  refreshToken: string;

  @ApiProperty({
    description: 'The expiration timestamp (Unix milliseconds) of the refresh token.',
    example: 1678886400000
  })
  @IsNumber()
  @IsInt()
  expiresIn: number;

  @ApiProperty({
    description: 'The unique ID of the authenticated user.',
    example: 5
  })
  @IsNumber()
  @IsInt()
  userId: number;
}
