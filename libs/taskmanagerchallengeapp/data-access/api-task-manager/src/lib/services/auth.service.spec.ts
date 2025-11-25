import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { TokenResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: { navigate: jest.Mock };
  let loggerSpy: any;

  beforeEach(() => {
    routerSpy = { navigate: jest.fn() };

    loggerSpy = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(), 
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and set tokens', () => {
    const mockTokens: TokenResponse = { accessToken: 'abc', refreshToken: '123' };
    const email = 'test@test.com';
    const password = 'pass';

    service.login(email, password).subscribe(res => {
      expect(res).toEqual(mockTokens);
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email, password });
    req.flush(mockTokens);

    expect(service.accessToken()).toBe('abc');
    expect(localStorage.getItem('accessToken')).toBe('abc');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should refresh tokens successfully', () => {
    (service as any).refreshTokenValue?.set('old_refresh');

    const newTokens: TokenResponse = { accessToken: 'new_access', refreshToken: 'new_refresh' };

    service.refreshTokens().subscribe();

    const req = httpMock.expectOne('/api/auth/refresh');
    expect(req.request.method).toBe('POST');

    expect(req.request.body).toEqual({});

    req.flush(newTokens);

    expect(service.accessToken()).toBe('new_access');
    expect(service.refreshInProgress()).toBe(false);
  });
});
