// /workspace-root/libs/app/shared/ui-layout/lib/main-layout/main-layout.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../util-logger/src/lib/services/logger.service';
import { signal } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;
  let authServiceMock: any;
  let loggerMock: any;

  beforeEach(async () => {
    // 1. Mock Auth Service
    authServiceMock = {
      isAuthenticated: signal(true),
      currentUser: signal({ email: 'test@test.com', permissions: 'read:tasks' }),
      userPermissions: signal(['read:tasks']),
      logout: jest.fn()
    };

    // 2. Mock Logger Service
    loggerMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        // FIX: Corrected array syntax and added Router provider
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call logout on button click', () => {
    // Act
    component.onLogout();

    // Assert
    expect(authServiceMock.logout).toHaveBeenCalled();
  });
});
