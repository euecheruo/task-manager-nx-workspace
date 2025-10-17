import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LogInDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/log-in.dto';
import { SignUpDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/sign-up.dto';
import { AuthResponse } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/auth-response.interface';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { RefreshJwtAuthGuard } from '../guards/refresh-jwt-auth.guard';
import { UserRequest } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/user-request.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Account created successfully.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(signUpDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and receive JWT tokens' })
  @ApiBody({ type: LogInDto })
  @ApiResponse({ status: 200, description: 'User authenticated, tokens issued.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async logIn(@Req() req: UserRequest): Promise<AuthResponse> {
    return this.authService.logIn(req.user);
  }

  @UseGuards(RefreshJwtAuthGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Use refresh token to obtain a new access token' })
  @ApiResponse({ status: 200, description: 'New access token issued.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  async refresh(@Req() req: UserRequest): Promise<AuthResponse> {
    const refreshToken = req.headers['authorization'].split(' ')[1];
    return this.authService.refreshTokens(req.user.userId, refreshToken);
  }
}
