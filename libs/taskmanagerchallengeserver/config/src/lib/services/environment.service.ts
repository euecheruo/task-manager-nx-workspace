import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  constructor(private configService: ConfigService) { }

  get<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (value === undefined) {
      throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
  }

  getAppPort(): number {
    return this.get<number>('APP_PORT');
  }

  isDevelopment(): boolean {
    return this.get<string>('NODE_ENV') === 'development';
  }

  getJwtAccessSecret(): string {
    return this.get<string>('JWT_ACCESS_SECRET');
  }

  getJwtRefreshSecret(): string {
    return this.get<string>('JWT_REFRESH_SECRET');
  }

  getJwtAccessExpiration(): string {
    return this.get<string>('JWT_ACCESS_EXPIRATION');
  }

  getJwtRefreshExpiration(): string {
    return this.get<string>('JWT_REFRESH_EXPIRATION');
  }

  getDatabaseConfig() {
    return {
      host: this.get<string>('POSTGRES_HOST'),
      port: this.get<number>('POSTGRES_PORT'),
      username: this.get<string>('POSTGRES_USER'),
      password: this.get<string>('POSTGRES_PASSWORD'),
      database: this.get<string>('POSTGRES_DB'),
    };
  }
}
