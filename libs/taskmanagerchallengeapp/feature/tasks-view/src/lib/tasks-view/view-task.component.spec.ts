import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewTaskComponent } from './view-task.component';
import { TasksService } from '../../../../../data-access/api-task-manager/src/lib/services/tasks.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ViewTaskComponent', () => {
  let component: ViewTaskComponent;
  let fixture: ComponentFixture<ViewTaskComponent>;
  let tasksServiceMock: any;
  let loggerServiceMock: any;

  beforeEach(async () => {
    tasksServiceMock = {
      getTask: jest.fn().mockReturnValue(of({
        taskId: 1,
        title: 'View Me',
        description: 'Test Description',
        creatorId: 1,
        creator: { email: 'creator@test.com' },
        assignedUserId: 2,
        assignedUser: { email: 'assignee@test.com' },
        isCompleted: false,
        createdAt: new Date().toISOString(),
        completedAt: null
      }))
    };

    loggerServiceMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ViewTaskComponent],
      providers: [
        { provide: TasksService, useValue: tasksServiceMock },
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

    fixture = TestBed.createComponent(ViewTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load task details', () => {
    expect(component.task()?.title).toBe('View Me');
    expect(component.task()?.creator.email).toBe('creator@test.com');

    expect(tasksServiceMock.getTask).toHaveBeenCalled();
  });
});
