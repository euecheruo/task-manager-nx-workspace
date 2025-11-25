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
    tasksServiceMock = {
      getTasks: jest.fn().mockReturnValue(of({ tasks: [], total: 0, page: 1, limit: 10 }))
    };

    authServiceMock = {
      currentUser: signal(null),
      userPermissions: signal([])
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
      imports: [DashboardComponent],
      providers: [
        { provide: TasksService, useValue: tasksServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        provideRouter([])
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
    expect(tasksServiceMock.getTasks).toHaveBeenCalled();
  });
});
