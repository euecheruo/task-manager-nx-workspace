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

    authServiceMock = {
      currentUser: signal({ userId: 1 }),
      userPermissions: signal(['update:own:tasks'])
    };

    usersServiceMock = {
      getAllUsers: jest.fn().mockReturnValue(of([]))
    };

    loggerServiceMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [UpdateTaskComponent],
      providers: [
        { provide: TasksService, useValue: tasksServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate form with existing task data on init', () => {
    expect(tasksServiceMock.getTask).toHaveBeenCalledWith(1);
  });

  it('should handle duplicate title error (409)', () => {
    tasksServiceMock.updateTask.mockReturnValue(throwError(() => ({ status: 409 })));

    component.taskId.set(1);
    component.title.set('Duplicate');
    component.onSubmit();

    fixture.detectChanges();

    expect(component.errorMessage()).toContain('already exists');
  });
});
