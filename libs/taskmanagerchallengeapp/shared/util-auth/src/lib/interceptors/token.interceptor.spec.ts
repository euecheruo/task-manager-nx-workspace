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
    authServiceMock = {
      accessToken: signal('test-token'),
      refreshInProgress: signal(false),
      getRefreshToken: jest.fn().mockReturnValue('refresh-token-val')
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([TokenInterceptor])),
        provideHttpClientTesting(),
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

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header to standard requests', () => {
    httpClient.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush({});
  });

  it('should use refresh token for refresh endpoint', () => {
    httpClient.post('/api/auth/refresh', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.headers.get('Authorization')).toBe('Bearer refresh-token-val');

    req.flush({});
  });
});
