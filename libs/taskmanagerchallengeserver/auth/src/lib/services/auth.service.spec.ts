import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../../../../users/src/lib/services/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let refreshRepo: RefreshTokensRepository;

  const mockUsersService = {
    getByEmail: jest.fn(),
    getPermissionsForUser: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
  };

  const mockRefreshRepo = {
    createToken: jest.fn(),
    validateAndRevokeToken: jest.fn(),
    revokeAllTokensForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RefreshTokensRepository, useValue: mockRefreshRepo },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    refreshRepo = module.get<RefreshTokensRepository>(RefreshTokensRepository);

    jest.clearAllMocks();
  });

  it('should validate credentials successfully', async () => {
    // Ensure the mock returns what the service expects to map
    mockUsersService.getByEmail.mockResolvedValue({ userId: 1, email: 'a@b.com', passwordHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.validateUserCredentials('a@b.com', 'pass');
    expect(result).toEqual({ userId: 1, email: 'a@b.com' });
  });

  it('should throw Unauthorized on invalid password', async () => {
    mockUsersService.getByEmail.mockResolvedValue({ userId: 1, passwordHash: 'hash' });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.validateUserCredentials('a@b.com', 'wrong')).rejects.toThrow(UnauthorizedException);
  });
});
