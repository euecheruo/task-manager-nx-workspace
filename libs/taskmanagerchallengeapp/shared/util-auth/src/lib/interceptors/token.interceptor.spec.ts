// /workspace-root/libs/app/shared/util-auth/lib/interceptors/token.interceptor.spec.ts

import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TokenInterceptor } from './token.interceptor';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../util-logger/src/lib/services/logger.service';
import { signal } from '@angular/core';

describe('TokenInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authServiceMock: any;

  beforeEach(() => {
    // 1. Mock AuthService
    authServiceMock = {
      accessToken: signal('test-token'),
      refreshInProgress: signal(false),
      getRefreshToken: jest.fn().mockReturnValue('refresh-token-val')
    };

    TestBed.configureTestingModule({
      providers: [
        // FIX 1: Register the interceptor using withInterceptors()
        provideHttpClient(withInterceptors([TokenInterceptor])),

        // FIX 2: Add the testing backend
        provideHttpClientTesting(),

        // FIX 3: Provide mocks
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            info: jest.fn()
          }
        }
      ]
    });

    // Inject services after configuration
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header to standard requests', () => {
    // Act
    httpClient.get('/test').subscribe();

    // Assert
    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush({});
  });

  it('should use refresh token for refresh endpoint', () => {
    // Act
    httpClient.post('/api/auth/refresh', {}).subscribe();

    // Assert
    const req = httpMock.expectOne('/api/auth/refresh');
    // Assuming your interceptor switches logic based on the URL to inject the refresh token instead
    expect(req.request.headers.get('Authorization')).toBe('Bearer refresh-token-val');

    req.flush({});
  });
});
