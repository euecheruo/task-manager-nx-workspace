import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { UsersModule } from '@task-manager-nx-workspace/api/users';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { RolesModule } from '@task-manager-nx-workspace/api/roles';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      imports: [],
      useFactory: async (envService: EnvironmentService) => ({
        secret: envService.getJwtAccessSecret(),
        signOptions: {
          expiresIn: envService.getJwtAccessExpiration()
        },
      }),
      inject: [EnvironmentService],
    }),
    UsersModule,
    RolesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshJwtStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }
