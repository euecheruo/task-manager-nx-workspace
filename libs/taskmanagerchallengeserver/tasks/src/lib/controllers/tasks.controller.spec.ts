// /workspace-root/libs/api/tasks/controllers/tasks.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from '../services/tasks.service';
import { AuthGuard } from '@nestjs/passport';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    assign: jest.fn(),
    unassign: jest.fn(),
    markComplete: jest.fn(),
    markIncomplete: jest.fn(),
  };

  beforeEach(async () => {
    // Best Practice: Clear mocks to ensure clean state between tests
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController], // FIXED: Added Controller here
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService, // FIXED: Injected Mock Service here
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should create a task', async () => {
    const dto = { title: 'New Task' };
    // Mimicking the user object usually injected by @CurrentUser()
    const user = { userId: 1 };
    const response = { taskId: 1, title: 'New Task' };

    mockTasksService.create.mockResolvedValue(response);

    // Ensure controller.create supports the (dto, user) signature
    expect(await controller.create(dto, user)).toEqual(response);

    // Verifying the service is called with the extracted ID
    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });

  it('should update a task', async () => {
    const dto = { title: 'Updated' };
    mockTasksService.update.mockResolvedValue({ taskId: 1, ...dto });

    // Even if the Service doesn't take the User ID, 
    // the Controller often still requires the User object (for guards/ownership checks).
    // Assuming controller.update(id, dto, user)
    await controller.update(1, dto, { userId: 1 });

    // Verifying the service receives ONLY the ID and DTO
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });
});
