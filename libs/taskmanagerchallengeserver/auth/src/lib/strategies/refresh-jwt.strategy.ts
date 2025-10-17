import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { JwtPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/jwt-payload.interface';
import { UsersService } from '@task-manager-nx-workspace/api/users/lib/services/users.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly envService: EnvironmentService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envService.getJwtRefreshSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.userId) {
      throw new UnauthorizedException('Invalid refresh token payload.');
    }

    return payload;
  }
}
