import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { JwtPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly envService: EnvironmentService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envService.getJwtAccessSecret(),
    });
  }

  async validate(payload: JwtPayload) {
 
    if (!payload.userId || !payload.permissions) {
      throw new UnauthorizedException('Invalid JWT payload.');
    }

    return payload;
  }
}
