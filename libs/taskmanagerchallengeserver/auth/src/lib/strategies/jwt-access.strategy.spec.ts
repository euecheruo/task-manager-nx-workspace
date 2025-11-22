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
            // CRITICAL: The strategy reads the secret in the constructor via super().
            // This mock must return a string, or instantiation will fail.
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

    // The validate method usually strips out iat, exp, iss, etc.
    // and returns just the user object needed for the Request.
    const result = await strategy.validate(payload);

    expect(result).toEqual({
      userId: 1,
      email: 'test@test.com',
      permissions: 'read:tasks'
    });
  });
});
