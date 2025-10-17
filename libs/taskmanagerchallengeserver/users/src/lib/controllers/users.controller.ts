import { Controller, Get, Body, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UserProfileDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-profile.dto';
import { UserUpdateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/users/user-update.dto';
import { JwtAuthGuard } from '@task-manager-nx-workspace/api/auth/lib/guards/jwt-auth.guard';
import { UserRequest } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/user-request.interface';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('profile')
  @Permissions('read:own:accounts')
  @ApiOperation({ summary: 'Retrieve the authenticated user\'s profile' })
  @ApiResponse({ status: 200, type: UserProfileDto, description: 'User profile details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@Req() req: UserRequest): Promise<UserProfileDto> {
    const user = await this.usersService.findUserById(req.user.userId);
    return new UserProfileDto(user);
  }

  @Patch('profile')
  @Permissions('update:own:accounts')
  @ApiOperation({ summary: 'Update the authenticated user\'s password' })
  @ApiResponse({ status: 200, description: 'User password updated successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid current password.' })
  async updateProfile(@Req() req: UserRequest, @Body() userUpdateDto: UserUpdateDto): Promise<UserProfileDto> {
    const user = await this.usersService.updateUserPassword(req.user.userId, userUpdateDto);
    return new UserProfileDto(user);
  }
}
