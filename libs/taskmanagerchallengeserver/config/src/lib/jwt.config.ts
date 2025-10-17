import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_SECRET,
  accessExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME || '7d',
}));
