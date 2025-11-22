// /workspace-root/libs/app/feature/tasks-dashboard/lib/dashboard.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { TasksService } from '../../../../../data-access/api-task-manager/src/lib/services/tasks.service';
import { UsersService } from '../../../../../data-access/api-task-manager/src/lib/services/users.service';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let tasksServiceMock: any;
  let authServiceMock: any;
  let usersServiceMock: any;
  let loggerServiceMock: any;

  beforeEach(async () => {
    // 1. Mock Tasks Service
    tasksServiceMock = {
      // FIX: Added empty array for 'tasks' to prevent syntax error and runtime crash
      getTasks: jest.fn().mockReturnValue(of({ tasks: [], total: 0, page: 1, limit: 10 }))
    };

    // 2. Mock Auth Service
    authServiceMock = {
      currentUser: signal(null),
      // FIX: Initialize signal with empty array to prevent iteration errors
      userPermissions: signal([])
    };

    // 3. Mock Users Service
    usersServiceMock = {
      // FIX: Return of([]) instead of of() so the component receives an array, not undefined
      getAllUsers: jest.fn().mockReturnValue(of([]))
    };

    // 4. Mock Logger Service (Missing in original)
    loggerServiceMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent], // Fixed syntax
      providers: [
        { provide: TasksService, useValue: tasksServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        provideRouter([]) // Added Router provider
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    // Verify the service was called during ngOnInit
    expect(tasksServiceMock.getTasks).toHaveBeenCalled();
  });
});
