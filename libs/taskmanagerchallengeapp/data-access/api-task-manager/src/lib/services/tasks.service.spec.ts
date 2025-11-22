import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TasksService } from './tasks.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { TaskListResponse } from '../models/task.model';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TasksService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() }
        }
      ]
    });

    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should fetch tasks with query params', () => {
    const mockResponse: TaskListResponse = { tasks: [], total: 0, page: 1, limit: 10 };

    service.getTasks({ page: 2, limit: 5 }).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(r =>
      r.url === '/api/tasks' &&
      r.params.get('page') === '2' &&
      r.params.get('limit') === '5'
    );

    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create a task', () => {
    const dto = { title: 'New Task', description: 'Desc' };

    service.createTask(dto).subscribe();

    const req = httpMock.expectOne('/api/tasks');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);

    req.flush({});
  });
});
