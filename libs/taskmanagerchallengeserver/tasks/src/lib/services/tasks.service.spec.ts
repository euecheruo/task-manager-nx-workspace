// /workspace-root/libs/api/tasks/services/tasks.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TasksRepository } from '../repositories/tasks.repository';
import { UsersRepository } from '../../../../users/src/lib/repositories/users.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let tasksRepo: TasksRepository;
  let usersRepo: UsersRepository;

  const mockTasksRepo = {
    findAndCountTasks: jest.fn(),
    findOneById: jest.fn(),
    findOneByTitle: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUsersRepo = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    // Best Practice: Clear mock history before every test to prevent pollution
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService, // The service we are testing
        {
          provide: TasksRepository, // The dependency injection token
          useValue: mockTasksRepo,  // The mock implementation
        },
        {
          provide: UsersRepository,
          useValue: mockUsersRepo,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    tasksRepo = module.get<TasksRepository>(TasksRepository);
    usersRepo = module.get<UsersRepository>(UsersRepository);
  });

  it('should create a task successfully', async () => {
    // 1. Mock no duplicate title
    mockTasksRepo.findOneByTitle.mockResolvedValue(null);

    // 2. Mock save returning an entity with an ID
    mockTasksRepo.save.mockResolvedValue({ task_id: 1 });

    // 3. Mock findOneById returning the FULL entity (required for mapping)
    mockTasksRepo.findOneById.mockResolvedValue({
      task_id: 1,
      title: 'T',
      creator_id: 1,
      creator: { userId: 1, email: 'test@test.com', createdAt: new Date() },
      assignedUser: null,
      created_at: new Date(),
      is_completed: false
    });

    const result = await service.create({ title: 'T' }, 1);

    // Assertion passed: result.taskId is now 1 (mapped from task_id)
    expect(result.taskId).toBe(1);
    expect(mockTasksRepo.save).toHaveBeenCalled();
  });

  it('should throw ConflictException on duplicate title', async () => {
    mockTasksRepo.findOneByTitle.mockResolvedValue({ task_id: 2 });
    await expect(service.create({ title: 'T' }, 1)).rejects.toThrow(ConflictException);
  });
});
