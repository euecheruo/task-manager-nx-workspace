import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  constructor(private configService: ConfigService) { }

  isDevelopment(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  getAppPort(): number {
    return this.configService.get<number>('app.port', 3000);
  }

  getDatabaseConfig() {
    return this.configService.get<any>('database')!;
  }

  getJwtAccessSecret(): string {
    return this.configService.get<string>('auth.jwtAccessSecret')!;
  }

  getJwtRefreshSecret(): string {
    return this.configService.get<string>('auth.jwtRefreshSecret')!;
  }

  getJwtAccessExpiration(): string {
    return this.configService.get<string>('auth.jwtAccessExpiration', '15m');
  }

  getJwtRefreshExpiration(): string {
    return this.configService.get<string>('auth.jwtRefreshExpiration', '7d');
  }

  get<T>(key: string, defaultValue?: T): T {
    return this.configService.get<T>(key) ?? defaultValue!;
  }
}
