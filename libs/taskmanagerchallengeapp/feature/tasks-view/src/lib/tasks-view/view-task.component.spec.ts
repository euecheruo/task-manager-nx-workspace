// /workspace-root/libs/app/feature/tasks-view/lib/view-task.component.spec.ts

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
    // 1. Define the TaskService Mock
    tasksServiceMock = {
      // Returns the complete object to prevent template errors
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

    // 2. Define Logger Mock (required for dependency injection)
    loggerServiceMock = {
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ViewTaskComponent], // Fixed syntax: Added array brackets
      providers: [
        { provide: TasksService, useValue: tasksServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
        // 3. Mock ActivatedRoute to simulate URL parameter ID '1'
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
    fixture.detectChanges(); // Triggers ngOnInit and the service call
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load task details', () => {
    // No need to call detectChanges() again here as it's called in beforeEach
    expect(component.task()?.title).toBe('View Me');
    expect(component.task()?.creator.email).toBe('creator@test.com');

    // Verify service was called
    expect(tasksServiceMock.getTask).toHaveBeenCalled();
  });
});
