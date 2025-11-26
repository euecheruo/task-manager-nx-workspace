import { Injectable, Logger, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  private readonly logger = new Logger(RefreshTokenGuard.name);

  constructor() {
    super();
    this.logger.verbose('RefreshTokenGuard initialized.');
  }

  /**
   * Overrides the handleRequest method to control the exception flow and attach 
   * the refresh token to the request object if authentication succeeds.
   * @param err Error thrown by the underlying Passport strategy.
   * @param user The payload validated by the Passport strategy (if successful).
   * @param info Authentication failure information.
   * @param context The execution context.
   */
  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (err || !user) {
      this.logger.warn(`Refresh token authentication failed: ${info?.message || err?.message}`);
      throw err || new UnauthorizedException();
    }

    request.user = user;
    this.logger.verbose(`Refresh token successfully validated for user ID: ${user.userId}`);
    return user;
  }

}
