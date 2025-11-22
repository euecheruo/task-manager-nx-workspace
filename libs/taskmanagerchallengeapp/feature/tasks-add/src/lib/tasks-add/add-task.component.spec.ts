import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddTaskComponent } from './add-task.component';
import { TasksService } from '../../../../../data-access/api-task-manager/src/lib/services/tasks.service';
import { UsersService } from '../../../../../data-access/api-task-manager/src/lib/services/users.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('AddTaskComponent', () => {
  let component: AddTaskComponent;
  let fixture: ComponentFixture<AddTaskComponent>;
  let tasksServiceMock: any;
  let usersServiceMock: any;
  let loggerServiceMock: any;

  beforeEach(async () => {
    tasksServiceMock = {
      createTask: jest.fn()
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
      imports: [AddTaskComponent],
      providers: [
        { provide: TasksService, useValue: tasksServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle duplicate title error (409)', () => {
    tasksServiceMock.createTask.mockReturnValue(throwError(() => ({ status: 409 })));

    component.title.set('Duplicate');
    component.onSubmit();

    expect(component.errorMessage()).toContain('already exists');
  });
});
