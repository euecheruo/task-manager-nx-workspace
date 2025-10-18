import { registerAs } from '@nestjs/config';
import { EnvVars } from './validations/environment.validation';
import { JwtModuleOptions } from '@nestjs/jwt';

export default registerAs('jwt', (): JwtModuleOptions => {
  const env: EnvVars = process.env as any;

  return {
    secret: env.JWT_ACCESS_SECRET,
    signOptions: {
      expiresIn: env.JWT_ACCESS_EXPIRATION,
    },
  };
});
