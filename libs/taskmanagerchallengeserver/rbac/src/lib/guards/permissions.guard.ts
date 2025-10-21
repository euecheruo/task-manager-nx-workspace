import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRequestPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/user-request-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserRequestPayload;

    if (!user || !user.permissions) {
      return false;
    }

    const userPermissions = user.permissions;

    return requiredPermissions.every((requiredPerm) =>
      userPermissions.includes(requiredPerm),
    );
  }
}
