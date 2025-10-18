import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { SignUpDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/sign-up.dto';
import { LogInDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/log-in.dto';
import { TokenRefreshDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/token-refresh.dto';
import { TokenResponseDto } from '@task-manager-nx-workspace/api/shared/lib/dto/auth/token-response.dto';
import { UserData } from '@task-manager-nx-workspace/api/shared/lib/interfaces/users/user-data.interface'; 

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account with email and password.' })
  @ApiResponse({ status: 201, type: TokenResponseDto, description: 'User created successfully, returns access and refresh tokens.' })
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto): Promise<TokenResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Authenticate a user with email and password to receive tokens.' })
  @ApiBody({ type: LogInDto, description: 'User credentials.' })
  @ApiResponse({ status: 200, type: TokenResponseDto, description: 'Login successful, returns access and refresh tokens.' })
  @ApiResponse({ status: 401, description: 'Unauthorized due to invalid credentials.' })
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: { user: UserData }): Promise<TokenResponseDto> {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Use a refresh token to obtain a new access token and a new refresh token.' })
  @ApiResponse({ status: 200, type: TokenResponseDto, description: 'Token rotation successful.' })
  @ApiResponse({ status: 401, description: 'Unauthorized due to invalid, revoked, or expired refresh token.' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: TokenRefreshDto): Promise<TokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke the current refresh token to end the session.' })
  @ApiResponse({ status: 200, description: 'Logout successful (refresh token revoked).' })
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: TokenRefreshDto): Promise<void> {
    return this.authService.logout(refreshTokenDto);
  }
}
