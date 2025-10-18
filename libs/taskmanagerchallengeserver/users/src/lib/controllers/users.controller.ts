import { Controller, Get, Body, Patch, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { PermissionsGuard } from '@task-manager-nx-workspace/api/rbac/lib/guards/permissions.guard';
import { Permissions } from '@task-manager-nx-workspace/api/rbac/lib/decorators/permissions.decorator';
import { UserRequest } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/user-request.interface';
import { UserProfileDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-profile.dto';
import { UserUpdateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-update.dto';

@ApiTags('Users (Profile)')
@ApiBearerAuth()
@UseGuards(PermissionsGuard) // Apply permissions check
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('profile')
  @Permissions('read:own:accounts')
  @ApiOperation({ summary: 'Retrieve the authenticated user’s profile, roles, and permissions.' })
  @ApiResponse({ status: 200, type: UserProfileDto, description: 'User profile data with RBAC details.' })
  async getProfile(@Req() req: UserRequest): Promise<UserProfileDto> {
    const userId = req.user.userId;
    return this.usersService.findProfileById(userId);
  }

  @Patch('profile')
  @Permissions('update:own:accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the authenticated user’s own password, requiring current password verification.' })
  @ApiResponse({ status: 200, type: UserProfileDto, description: 'Updated user profile data.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Invalid current password.' })
  async updateProfile(
    @Req() req: UserRequest,
    @Body() userUpdateDto: UserUpdateDto
  ): Promise<UserProfileDto> {
    const userId = req.user.userId;
    return this.usersService.update(userId, userUpdateDto);
  }
}
