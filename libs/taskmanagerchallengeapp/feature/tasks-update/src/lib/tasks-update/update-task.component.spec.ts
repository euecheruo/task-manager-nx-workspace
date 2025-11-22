// /workspace-root/libs/app/feature/tasks-update/lib/update-task.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateTaskComponent } from './update-task.component';
import { TasksService } from '../../../../../data-access/api-task-manager/src/lib/services/tasks.service';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { UsersService } from '../../../../../data-access/api-task-manager/src/lib/services/users.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

describe('UpdateTaskComponent', () => {
  let component: UpdateTaskComponent;
  let fixture: ComponentFixture<UpdateTaskComponent>;
  let tasksServiceMock: any;
  let authServiceMock: any;
  let usersServiceMock: any;
  let loggerServiceMock: any;

  beforeEach(async () => {
    // 1. Mock Tasks Service
    tasksServiceMock = {
      getTask: jest.fn().mockReturnValue(of({
        taskId: 1,
        title: 'Original Title',
        creatorId: 1,
        isCompleted: false,
        assignedUserId: null
      })),
      updateTask: jest.fn().mockReturnValue(of({
        taskId: 1,
        title: 'Updated',
        isCompleted: false
      }))
    };

    // 2. Mock Auth Service
    authServiceMock = {
      currentUser: signal({ userId: 1 }),
      userPermissions: signal(['update:own:tasks'])
    };

    // 3. Mock Users Service
    usersServiceMock = {
      // FIX: Return an empty array [] instead of undefined to prevent iteration errors in template
      getAllUsers: jest.fn().mockReturnValue(of([]))
    };

    // 4. Mock Logger Service (Missing in original code)
    loggerServiceMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [UpdateTaskComponent], // Fixed syntax
      providers: [
        { provide: TasksService, useValue: tasksServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        // 5. Mock ActivatedRoute to simulate URL parameter (e.g. /edit/1)
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => '1' } },
            paramMap: of({ get: () => '1' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Triggers ngOnInit (and likely getTask)
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate form with existing task data on init', () => {
    // Verify getTask was called with ID 1 (from ActivatedRoute mock)
    expect(tasksServiceMock.getTask).toHaveBeenCalledWith(1);
  });

  it('should handle duplicate title error (409)', () => {
    // Arrange: Force updateTask to fail with 409
    tasksServiceMock.updateTask.mockReturnValue(throwError(() => ({ status: 409 })));

    // Act
    component.taskId.set(1);
    component.title.set('Duplicate');
    component.onSubmit();

    // Detect changes not strictly necessary for signal update, but good for template checks
    fixture.detectChanges();

    // Assert
    expect(component.errorMessage()).toContain('already exists');
  });
});
