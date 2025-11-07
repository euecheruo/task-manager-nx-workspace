import { Controller, Post, Body, UseGuards, Req, Logger, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/login.dto';
import { TokenResponseDto } from '../dtos/token-response.dto';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';
import { CurrentUser } from '../../../../shared/src/lib/decorators/current-user.decorator';
interface JwtPayloadWithRt { userId: number; refreshToken: string; }


@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private authService: AuthService) { }

  /**
   * Endpoint for user login. Public route.
   * Expected status codes: 200 (Success), 500 (Internal Server Error)
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    const { email } = loginDto;
    this.logger.log(`Attempting login for email: ${email}`);
    const tokens = await this.authService.login(email, loginDto.password);
    this.logger.verbose(`Login successful for email: ${email}`);
    return tokens;
  }

  /**
   * Endpoint to refresh the access token using a valid refresh token.
   * Protected by RefreshTokenGuard.
   * Expected status codes: 200 (Success), 401 (Unauthorized), 500 (Internal Server Error)
   */
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshTokens(@CurrentUser() user: JwtPayloadWithRt): Promise<TokenResponseDto> {
    const { userId, refreshToken } = user;
    this.logger.log(`Received refresh token request for user: ${userId}`);
    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    this.logger.verbose(`Tokens refreshed successfully for user: ${userId}`);
    return tokens;
  }

  /**
   * Endpoint to invalidate the refresh token/session.
   * Protected by JwtAuthGuard (requires a valid access token for session context).
   * Expected status codes: 200 (Success), 401 (Unauthorized), 500 (Internal Server Error)
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: { userId: number }): Promise<{ success: boolean }> {
    this.logger.log(`Attempting logout for user: ${user.userId}`);
    await this.authService.logout(user.userId);
    this.logger.verbose(`Logout successful for user: ${user.userId}`);
    return { success: true };
  }
}
