// /workspace-root/libs/app/feature/user-profile/lib/user-profile.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProfileComponent } from './user-profile.component';
import { UsersService } from '../../../../../data-access/api-task-manager/src/lib/services/users.service';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let usersServiceMock: any;
  let authServiceMock: any;
  let loggerServiceMock: any;

  beforeEach(async () => {
    // 1. Mock Users Service
    usersServiceMock = {
      getMe: jest.fn().mockReturnValue(of({ userId: 1, email: 'test@test.com' }))
    };

    // 2. Mock Auth Service
    authServiceMock = {
      isAuthenticated: jest.fn().mockReturnValue(true),
      // FIX: Initialize signal with a value (empty array) to prevent 'undefined' errors if iterated
      userPermissions: signal([])
    };

    // 3. Mock Logger Service (Missing in original code)
    loggerServiceMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [ // FIX: Corrected array syntax
        { provide: UsersService, useValue: usersServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        provideRouter([]) // FIX: added execution of the router provider
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch profile data', () => {
    // Verify that the component called the service and updated the signal
    expect(usersServiceMock.getMe).toHaveBeenCalled();
    expect(component.userProfile()?.email).toBe('test@test.com');
  });
});
