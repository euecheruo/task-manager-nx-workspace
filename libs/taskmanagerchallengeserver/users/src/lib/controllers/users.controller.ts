// /workspace-root/libs/api/users/controllers/users.controller.ts

import { Controller, Get, UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../../../auth/src/lib/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/src/lib/guards/permission.guard';
import { CurrentUser } from '../../../../shared/src/lib/decorators/current-user.decorator';
import { RequirePermission } from '../../../../shared/src/lib/decorators/permission.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
// FIX: Imported the class-based DTO for Swagger reference
import { UserProfileDto } from '../dtos/user-profile.dto';

// FIX: Removed the local interface definition as it's replaced by the DTO class
@ApiTags('users') // Added ApiTag for Swagger grouping
@ApiBearerAuth('accessToken') // Specify JWT authentication for all endpoints
@UseGuards(JwtAuthGuard) // Apply JWT authentication globally to the controller
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  // FIX: UserProfile interface replaced by UserProfileDto type in constructor
  constructor(private usersService: UsersService) { }

  /**
   * Retrieves the authenticated user's profile details.
   * Requires a valid JWT token and the 'read:own:accounts' permission.
   * Expected status codes: 200, 401, 403, 500.
   */
  @Get('me')
  @UseGuards(PermissionGuard)
  @RequirePermission('read:own:accounts')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  // FIX: Used the DTO class (UserProfileDto) for Swagger type inference
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing read:own:accounts permission' })
  // FIX: Used DTO type in Promise signature
  async getProfile(@CurrentUser() user: { userId: number }): Promise<UserProfileDto> {
    this.logger.log(`Fetching profile for authenticated user ID: ${user.userId}`);
    try {
      // The underlying service method still returns the expected structure
      const profile = await this.usersService.getProfile(user.userId);
      this.logger.verbose(`Profile retrieved successfully for user ID: ${user.userId}`);
      return profile;
    } catch (error: unknown) {

      if (error instanceof NotFoundException) {
        this.logger.warn(`User ID ${user.userId} not found, despite valid token.`);
        throw error;
      }

      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error fetching profile for user ID ${user.userId}`, errorStack);
      throw error;
    }
  }

  /**
   * Retrieves a list of all user profiles (for assignment/lookup).
   * Requires a valid JWT token and the 'read:tasks' permission (since assignment relies on this list).
   * Expected status codes: 200, 401, 403, 500.
   */
  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('read:tasks') // Use read:tasks as users must be able to view tasks to assign them
  @ApiOperation({ summary: 'Get list of all user profiles (for task assignment)' })
  // FIX: Used the DTO class ([UserProfileDto]) for Swagger array type inference
  @ApiResponse({ status: 200, description: 'List of all user profiles retrieved successfully', type: [UserProfileDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden: Missing read:tasks permission' })
  // FIX: Used DTO array type in Promise signature
  async getAllUsers(): Promise<UserProfileDto[]> {
    this.logger.log('Fetching all user profiles for assignment lists.');
    try {
      // The underlying service method still returns the expected structure
      const profiles = await this.usersService.getAllUsers();
      this.logger.verbose(`Retrieved ${profiles.length} user profiles.`);
      return profiles;
    } catch (error: unknown) {
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error fetching all user profiles.`, errorStack);
      throw error;
    }
  }
}
