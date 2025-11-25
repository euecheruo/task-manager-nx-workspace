import { Test, TestingModule } from '@nestjs/testing';
import { JwtAccessStrategy } from './jwt-access.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtAccessStrategy', () => {
  let strategy: JwtAccessStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAccessStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test_secret_key'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtAccessStrategy>(JwtAccessStrategy);
  });

  it('should validate and return user payload', async () => {
    const payload = {
      sub: 1,
      userId: 1,
      email: 'test@test.com',
      permissions: 'read:tasks',
      iat: 1000000,
      exp: 2000000,
      iss: 'test_issuer',
      aud: 'test_audience'
    };

    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: 1,
      email: 'test@test.com',
      permissions: 'read:tasks'
    });
  });
});
