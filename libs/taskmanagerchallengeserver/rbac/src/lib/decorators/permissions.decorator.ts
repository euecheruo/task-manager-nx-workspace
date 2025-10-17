import { SetMetadata } from '@nestjs/common';
import { Permission } from '@task-manager-nx-workspace/api/shared/lib/types/permission.type';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
