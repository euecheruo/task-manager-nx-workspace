import { ExecutionContext } from '@nestjs/common';
import { UserRequest } from './auth/user-request.interface';

export interface PermissionHandler {
  canActivate(user: UserRequest['user'], context: ExecutionContext): Promise<boolean>;
}
