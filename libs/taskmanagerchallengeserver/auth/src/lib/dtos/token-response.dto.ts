import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';
export class TokenResponseDto {
  @ApiProperty({ example: 'Bearer', description: 'The type of token being returned (standard is Bearer).' })
  @IsString()
  @IsNotEmpty()
  tokenType: string;
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJlbWFpbCI6ImVkaXRvckB0YXNrLmNvbSIs...',
    description: 'The JSON Web Access Token (JWT) used for protected resource requests.',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJlbWFhaWwiOiJlZGl0b3JAdGFzay5jb20iLC...',
    description: 'The refresh token used to obtain a new access token when the current one expires. This should be securely handled by the client.',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
  @ApiProperty({
    example: 900, // 15 minutes
    description: 'The lifespan of the access token, in seconds (Time to Live).',
  })
  @IsNumber()
  @IsNotEmpty()
  expiresIn: number;
}
