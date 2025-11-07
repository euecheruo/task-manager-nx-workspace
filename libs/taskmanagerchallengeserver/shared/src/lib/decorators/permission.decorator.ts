import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Custom decorator used to define the specific permissions required 
 * to access a controller method or entire controller.
 * Permissions are defined in the RBAC matrix (e.g., 'read:tasks', 'update:own:tasks').
 * This decorator attaches metadata that the PermissionGuard reads.
 * Usage: @RequirePermission('read:tasks', 'create:tasks')
 * @param permissions A list of permission strings required for access.
 */
export const RequirePermission = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
