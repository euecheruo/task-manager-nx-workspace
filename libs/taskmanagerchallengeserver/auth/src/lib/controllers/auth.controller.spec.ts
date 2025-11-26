import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should return tokens on login', async () => {
    const dto: LoginDto = { email: 'test@test.com', password: 'password' };
    const tokens = {
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 900
    };

    mockAuthService.login.mockResolvedValue(tokens);

    expect(await controller.login(dto)).toEqual(tokens);

    expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
  });

  it('should call logout service', async () => {
    const mockUser = { userId: 1 };

    await controller.logout(mockUser);

    expect(authService.logout).toHaveBeenCalledWith(1);
  });
});
