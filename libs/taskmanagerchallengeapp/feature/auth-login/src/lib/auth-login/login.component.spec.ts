import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceMock: any;
  let routerMock: any;
  let loggerServiceMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: jest.fn(),
      isAuthenticated: signal(false)
    };

    routerMock = {
      navigate: jest.fn()
    };

    loggerServiceMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: LoggerService, useValue: loggerServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call authService.login on submit and navigate on success', () => {
    authServiceMock.login.mockReturnValue(of({ accessToken: 't', refreshToken: 'r' }));

    component.email.set('test@test.com');
    component.password.set('password');
    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('test@test.com', 'password');

  });

  it('should set error message on failure', () => {
    authServiceMock.login.mockReturnValue(throwError(() => new Error('Fail')));

    component.email.set('test@test.com');
    component.password.set('wrong');
    component.onSubmit();

    expect(component.errorMessage()).toContain('Login failed');
  });
});
