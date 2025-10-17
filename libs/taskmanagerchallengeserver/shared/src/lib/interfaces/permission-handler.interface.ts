import { ExecutionContext } from '@nestjs/common';
import { UserRequest } from './user-request.interface';

export interface PermissionHandler {
  canActivate(user: UserRequest['user'], context: ExecutionContext): Promise<boolean>;
}
