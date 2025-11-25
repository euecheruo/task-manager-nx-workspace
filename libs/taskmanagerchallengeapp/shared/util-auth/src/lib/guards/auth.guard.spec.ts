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
    authServiceMock = {
      isAuthenticated: signal(false)
    };

    routerMock = {
      createUrlTree: jest.fn().mockReturnValue('login-url-tree')
    };

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

    const result = TestBed.runInInjectionContext(() =>
      AuthGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
  });

  it('should redirect to login if not authenticated', () => {
    authServiceMock.isAuthenticated.set(false);

    const result = TestBed.runInInjectionContext(() =>
      AuthGuard({} as any, {} as any)
    );

    expect(result).toBe('login-url-tree');
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
