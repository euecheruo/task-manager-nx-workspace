import { Controller, Get, UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../../../auth/src/lib/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/src/lib/guards/permission.guard';
import { CurrentUser } from '../../../../shared/src/lib/decorators/current-user.decorator';
import { RequirePermission } from '../../../../shared/src/lib/decorators/permission.decorator';

interface UserProfile {
  userId: number; email: string; createdAt: Date;
}

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private usersService: UsersService) { }

  /**
   * Retrieves the authenticated user's profile details.
   * Requires a valid JWT token and the 'read:own:accounts' permission.
   * Expected status codes: 200, 401, 403, 500.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('read:own:accounts')
  async getProfile(@CurrentUser() user: { userId: number }): Promise<UserProfile> {
    this.logger.log(`Fetching profile for authenticated user ID: ${user.userId}`);
    try {
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
}
