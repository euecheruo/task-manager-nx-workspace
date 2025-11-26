import { Injectable, Logger, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor() {
    super();
    this.logger.verbose('JwtAuthGuard initialized.');
  }

  /**
   * Overrides the handleRequest method to control the exception flow.
   * If the authentication fails, it ensures an UnauthorizedException is thrown.
   * @param err Error thrown by the underlying Passport strategy.
   * @param user The authenticated user object (payload) validated by the Passport strategy.
   * @param info Authentication failure information.
   * @param context The execution context.
   */
  override handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    if (err || !user) {
      this.logger.warn(`JWT authentication failed on route ${request.url}: ${info?.message || err?.message}`);

      throw err || new UnauthorizedException();
    }

    request.user = user;
    this.logger.verbose(`JWT successfully validated for user ID: ${user.userId}`);
    return user;
  }
}
