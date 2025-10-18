import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from '../validations/environment.validation';

@Injectable()
export class EnvironmentService {
  constructor(private configService: ConfigService<EnvVars, true>) { }

  public get<T>(key: keyof EnvVars): T {
    return this.configService.get(key, { infer: true }) as T;
  }

  getAppPort(): number {
    return this.configService.get('APP_PORT');
  }

  isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  isDevelopment(): boolean {
    return this.configService.get('NODE_ENV') === 'development';
  }

  getJwtAccessSecret(): string {
    return this.configService.get('JWT_ACCESS_SECRET');
  }

  getJwtAccessExpiration(): string {
    return this.configService.get('JWT_ACCESS_EXPIRATION');
  }

  getJwtRefreshSecret(): string {
    return this.configService.get('JWT_REFRESH_SECRET');
  }

  getJwtRefreshExpiration(): string {
    return this.configService.get('JWT_REFRESH_EXPIRATION');
  }
}
