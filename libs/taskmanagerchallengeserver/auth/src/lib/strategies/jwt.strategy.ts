import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';
import { JwtPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/jwt-payload.interface';
import { UserRequestPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/user-request-payload.interface';
import { UsersService } from '@task-manager-nx-workspace/api/users/lib/services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly envService: EnvironmentService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserRequestPayload> {
    return {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  }
}
