// /workspace-root/libs/api/tasks/repositories/tasks.repository.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { TasksRepository } from './tasks.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskEntity } from '../../../../data-access/src/lib/entities/task.entity';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TaskFilterQuery } from '../dtos/task-filter.query';

describe('TasksRepository', () => {
  let repository: TasksRepository;
  let typeOrmRepo: Repository<TaskEntity>;

  // Mock Data
  const mockTask = {
    task_id: 1,
    title: 'Test Task',
    is_completed: false,
    created_at: new Date(),
  } as TaskEntity;

  // 1. Mock Query Builder
  // Note: Most methods return 'this' to allow chaining (.where().orderBy().skip())
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(), // Return value set in tests
  };

  // 2. Mock the TypeORM Repository
  const mockTypeOrmRepo = {
    // This is the critical link: calling createQueryBuilder returns the mock builder defined above
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // 3. Fix the providers array syntax
      providers: [
        TasksRepository,
        {
          provide: getRepositoryToken(TaskEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<TasksRepository>(TasksRepository);
    typeOrmRepo = module.get<Repository<TaskEntity>>(getRepositoryToken(TaskEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAndCountTasks', () => {
    it('should apply default pagination and return results', async () => {
      // getManyAndCount returns [Array of Entities, Total Count]
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockTask], 1]);

      const query: TaskFilterQuery = { page: 1, limit: 10 };

      const result = await repository.findAndCountTasks(query);

      // Verify the alias used in your repo matches 'task'
      expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('task');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('task.created_at', 'DESC');

      expect(result).toEqual({ tasks: [mockTask], count: 1 });
    });

    it('should apply "assigned" filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      const query: TaskFilterQuery = { assignmentFilter: 'assigned' };

      await repository.findAndCountTasks(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('task.assigned_user_id IS NOT NULL');
    });

    it('should apply "unassigned" filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      const query: TaskFilterQuery = { assignmentFilter: 'unassigned' };

      await repository.findAndCountTasks(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('task.assigned_user_id IS NULL');
    });

    it('should apply "completed" filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      const query: TaskFilterQuery = { completionFilter: 'completed' };

      await repository.findAndCountTasks(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('task.is_completed = :isCompleted', { isCompleted: true });
    });

    it('should apply "incomplete" filter', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      const query: TaskFilterQuery = { completionFilter: 'incomplete' };

      await repository.findAndCountTasks(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('task.is_completed = :isCompleted', { isCompleted: false });
    });

    it('should calculate skip correctly for page 2', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      const query: TaskFilterQuery = { page: 2, limit: 5 };

      await repository.findAndCountTasks(query);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (2-1) * 5
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('findOneById', () => {
    it('should return a task if found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockTask);

      const result = await repository.findOneById(1);
      expect(result).toEqual(mockTask);
      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { task_id: 1 },
        relations: ['creator', 'assignedUser'],
      });
    });

    it('should return null if not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      const result = await repository.findOneById(999);
      expect(result).toBeNull();
    });
  });

  describe('findOneByTitle', () => {
    it('should return a task by title', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(mockTask);
      const result = await repository.findOneByTitle('Test Task');
      expect(result).toEqual(mockTask);
    });
  });

  describe('save', () => {
    it('should save and return the task', async () => {
      mockTypeOrmRepo.save.mockResolvedValue(mockTask);
      const result = await repository.save({ title: 'New' });
      expect(result).toEqual(mockTask);
      expect(typeOrmRepo.save).toHaveBeenCalledWith({ title: 'New' });
    });
  });

  describe('update', () => {
    it('should update and return the updated task', async () => {
      const updatePayload = { title: 'Updated' };
      const updatedTask = { ...mockTask, ...updatePayload };

      // Mock update success
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      // Mock findOne returning the updated entity
      mockTypeOrmRepo.findOne.mockResolvedValue(updatedTask);

      const result = await repository.update(1, updatePayload);

      expect(typeOrmRepo.update).toHaveBeenCalledWith({ task_id: 1 }, updatePayload);
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException if no rows affected', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 0 } as UpdateResult);

      await expect(repository.update(1, {})).rejects.toThrow(NotFoundException);
      expect(typeOrmRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if task disappears after update', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      await expect(repository.update(1, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete and return affected count', async () => {
      mockTypeOrmRepo.delete.mockResolvedValue({ affected: 1 } as DeleteResult);

      const result = await repository.delete(1);
      expect(result).toEqual({ affected: 1 });
      expect(typeOrmRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
