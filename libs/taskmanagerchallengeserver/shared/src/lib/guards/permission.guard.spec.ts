// /workspace-rootlibs/api/shared/guards/permission.guard.spec.ts

import { PermissionGuard } from './permission.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionGuard(reflector);
  });

  const createMockContext = (user: any, handler = {}): ExecutionContext => ({
    getHandler: () => handler,
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as any);

  it('should return true if no permissions required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ userId: 1 });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user has required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read:tasks']);
    const context = createMockContext({ permissions: 'read:tasks,create:tasks' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw Forbidden if user lacks permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['delete:tasks']);
    const context = createMockContext({ permissions: 'read:tasks' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
