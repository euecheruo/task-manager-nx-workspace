import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user1@faketest.com', description: 'User\'s email address.' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @ApiProperty({ example: 'MK2~DT?8R^=G~5oaM6Gw+8', description: 'User\'s password.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;
}
