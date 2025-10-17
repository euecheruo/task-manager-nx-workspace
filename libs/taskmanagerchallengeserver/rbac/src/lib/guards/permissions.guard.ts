import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { JwtPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/jwt-payload.interface';
import { Permission } from '@task-manager-nx-workspace/api/shared/lib/types/permission.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user || !user.permissions || user.permissions.length === 0) {
      return false;
    }

    const userPermissions = new Set(user.permissions);

    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.has(permission)
    );

    return hasRequiredPermissions;
  }
}
