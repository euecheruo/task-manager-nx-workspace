// /workspace-root/libs/api/users/repositories/users.repository.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../../../data-access/src/lib/entities/user.entity';
import { Repository } from 'typeorm';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let typeOrmRepo: Repository<UserEntity>;

  // Mock the QueryBuilder chain
  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  // Mock the Repository methods
  const mockTypeOrmRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository, // 1. Provide the class under test
        {
          // 2. Provide the mock for the injected Repository<UserEntity>
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    typeOrmRepo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    jest.clearAllMocks(); // Good practice to reset mocks between tests
  });

  it('should aggregate permissions correctly', async () => {
    mockQueryBuilder.getRawMany.mockResolvedValue([
      { permissionName: 'create:tasks' },
      { permissionName: 'read:tasks' },
    ]);

    const result = await repository.getUserRolesAndPermissions(1);

    // Ensures the query builder was actually called
    expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(result).toBe('create:tasks,read:tasks');
  });

  it('should return empty string if no permissions found', async () => {
    // TypeORM usually returns an empty array [], not undefined, when no results are found
    mockQueryBuilder.getRawMany.mockResolvedValue([]);

    const result = await repository.getUserRolesAndPermissions(1);
    expect(result).toBe('');
  });
});
