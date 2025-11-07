import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
interface JwtPayloadWithRt { userId: number; refreshToken: string; }

/**
 * Custom extractor function to retrieve the raw refresh token.
 * We prioritize extracting it from the Authorization header as a Bearer token,
 * but this strategy only verifies the signature/expiration, not the hash.
 * The raw token must be passed to the AuthController/Service for hash lookup.
 */
const extractRawRefreshToken = (req: Request): string | null => {
  const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (token) {
    return token;
  }
  if (req.body?.refreshToken) {
    return req.body.refreshToken;
  }
  return null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: extractRawRefreshToken,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') as string,
      passReqToCallback: true, 
      audience: configService.get<string>('JWT_TOKEN_AUDIENCE') as string,
      issuer: configService.get<string>('JWT_TOKEN_ISSUER') as string,
    });
    this.logger.verbose('JwtRefreshStrategy initialized.');
  }

  /**
   * The validate method is executed after signature and expiration checks succeed.
   * @param req The raw request object.
   * @param payload The decoded JWT payload (userId (sub), email).
   * @returns A payload containing user ID and the raw refresh token string.
   */
  async validate(req: Request, payload: { sub: number; email: string }): Promise<JwtPayloadWithRt> {
    const refreshToken = extractRawRefreshToken(req);

    if (!refreshToken) {
        this.logger.warn(`Refresh token validation failed: Raw token missing from request.`);
        throw new UnauthorizedException('Refresh token missing.');
    }

    this.logger.debug(`Refresh token signature validated for user ID: ${payload.sub}`);
    return {
      userId: payload.sub,
      refreshToken: refreshToken,
    };
  }
}
