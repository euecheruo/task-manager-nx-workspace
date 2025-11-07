import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CurrentUserPayload } from '../../../../shared/src/lib/decorators/current-user.decorator';
interface AccessTokenPayload {
  userId: number;
  email: string;
  permissions: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  sub: number;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtAccessStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') as string,
      audience: configService.get<string>('JWT_TOKEN_AUDIENCE') as string,
      issuer: configService.get<string>('JWT_TOKEN_ISSUER') as string,
    });
    this.logger.verbose('JwtAccessStrategy initialized.');
  }

  /**
   * The validate method is executed after the token signature and expiration are verified.
   * It receives the decoded payload from the access token.
   * @param payload The decoded JWT payload (userId, email, permissions).
   * @returns The user object that will be attached to the request (req.user).
   */
  async validate(payload: AccessTokenPayload): Promise<CurrentUserPayload> {
    this.logger.debug(`Access token validated for user ID: ${payload.userId}`);
    return {
      userId: payload.sub,
      email: payload.email,
      permissions: payload.permissions,
    } as CurrentUserPayload;
  }
}
