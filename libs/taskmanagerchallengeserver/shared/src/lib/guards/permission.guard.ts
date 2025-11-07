import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permission.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(private reflector: Reflector) { }

  /**
   * Checks if the authenticated user has the necessary permissions to access the route.
   * This logic enforces the RBAC authorization step.
   * @throws ForbiddenException (HTTP 403) if permissions are insufficient.
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      this.logger.debug('No specific permissions required. Access granted.');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: CurrentUserPayload = request.user;

    if (!user || !user.permissions) {
      this.logger.warn(
        `Authorization failed: User payload or permissions missing for route requiring: [${requiredPermissions.join(
          ',',
        )}]`,
      );
      throw new ForbiddenException('Insufficient privileges: User claims incomplete.');
    }

    const userPermissionsSet = new Set(user.permissions.split(',').filter(p => p));

    const hasAllRequiredPermissions = requiredPermissions.every((requiredPerm) =>
      userPermissionsSet.has(requiredPerm),
    );

    if (hasAllRequiredPermissions) {
      this.logger.verbose(
        `User ${user.userId} granted access. Required: [${requiredPermissions.join(',')}]`,
      );
      return true;
    } else {
      const missingPermissions = requiredPermissions.filter(p => !userPermissionsSet.has(p));
      this.logger.warn(
        `User ${user.userId} forbidden access. Missing permissions: [${missingPermissions.join(
          ',',
        )}]`,
      );
      throw new ForbiddenException('Insufficient permissions to perform this action.');
    }
  }
}
