// /workspace-root/libs/app/shared/util-auth/lib/guards/auth.guard.spec.ts

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../util-logger/src/lib/services/logger.service';
import { signal, WritableSignal } from '@angular/core';

describe('AuthGuard', () => {
  let authServiceMock: { isAuthenticated: WritableSignal<boolean> };
  let routerMock: { createUrlTree: jest.Mock };
  let loggerMock: any;

  beforeEach(() => {
    // 1. Mock AuthService
    authServiceMock = {
      isAuthenticated: signal(false)
    };

    // 2. Mock Router (specifically createUrlTree for redirects)
    routerMock = {
      createUrlTree: jest.fn().mockReturnValue('login-url-tree')
    };

    // 3. Mock LoggerService
    loggerMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: LoggerService, useValue: loggerMock }
      ]
    });
  });

  it('should return true if authenticated', () => {
    // Arrange
    authServiceMock.isAuthenticated.set(true);

    // Act: Run guard in injection context (required for functional guards)
    const result = TestBed.runInInjectionContext(() =>
      AuthGuard({} as any, {} as any)
    );

    // Assert
    expect(result).toBe(true);
  });

  it('should redirect to login if not authenticated', () => {
    // Arrange
    authServiceMock.isAuthenticated.set(false);

    // Act
    const result = TestBed.runInInjectionContext(() =>
      AuthGuard({} as any, {} as any)
    );

    // Assert: Should return the UrlTree from createUrlTree
    expect(result).toBe('login-url-tree');
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
