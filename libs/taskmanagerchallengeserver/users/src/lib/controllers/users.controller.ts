import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { User } from '@task-manager-nx-workspace/api/auth/lib/decorators/user.decorator';
import { UserRequestPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/user-request-payload.interface';
import { UserResponseDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-response.dto';
import { UserProfileDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-profile.dto';
import { Permissions } from '@task-manager-nx-workspace/api/rbac/lib/decorators/permissions.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('profile')
  @Permissions('read:own:accounts')
  @ApiOperation({ summary: 'Get the profile of the current authenticated user.' })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User profile retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  async getProfile(
    @User() user: UserRequestPayload,
  ): Promise<UserProfileDto> {
    return { email: user.email } as UserProfileDto;
  }
}
