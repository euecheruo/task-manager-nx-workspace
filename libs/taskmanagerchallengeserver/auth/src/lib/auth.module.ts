import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { UsersModule } from '../../../users/src/lib/users.module';
import { DataAccessModule } from '../../../data-access/src/lib/data-access.module';
import { convertTimeStringToSeconds } from './strategies/jwt.utils';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DataAccessModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          audience: config.get<string>('JWT_TOKEN_AUDIENCE'),
          issuer: config.get<string>('JWT_TOKEN_ISSUER'),
          expiresIn: convertTimeStringToSeconds(config.get<string>('JWT_ACCESS_EXPIRATION')),
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    AuthService,
    RefreshTokensRepository,
    LocalStrategy,
    JwtAccessStrategy,
    JwtRefreshStrategy,
  ],
  exports: [
    AuthService,
    JwtModule,
    RefreshTokensRepository,
  ],
})
export class AuthModule { }
