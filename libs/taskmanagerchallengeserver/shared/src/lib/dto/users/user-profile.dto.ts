import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEmail, IsDate, IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';

type Role = 'editor' | 'viewer'; 
type Permission = 'create:tasks' | 'read:tasks' | 'assign:tasks' | 'update:own:tasks' | 'delete:own:tasks' | 'unassign:tasks' | 'mark:assigned:tasks' | 'unmark:assigned:tasks' | 'create:accounts' | 'update:own:accounts' | 'read:own:accounts'; 

export class UserProfileDto {
  @ApiProperty({ description: 'The unique ID of the user.', example: 5 })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'The user\'s email address.', example: 'editor_alice@tasks.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The timestamp when the account was created.', example: '2023-10-25T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'The list of roles assigned to the user.', example: ['editor'] })
  @IsArray()
  @IsString({ each: true })
  roles: Role[];

  @ApiProperty({ description: 'The list of aggregated permissions granted to the user.', example: ['create:tasks', 'read:tasks'] })
  @IsArray()
  @IsString({ each: true })
  permissions: Permission[];
}
