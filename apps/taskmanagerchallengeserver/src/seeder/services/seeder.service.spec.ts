// /workspace-root/libs/api/seeder/services/seeder.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { SeederService } from './seeder.service';
import { DataSource } from 'typeorm';

describe('SeederService', () => {
  let service: SeederService;
  let dataSource: DataSource;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn(),
      // Return a truthy object so "if (!role ||!permission)" check passes
      findOne: jest.fn().mockResolvedValue({ id: 1, name: 'MockEntity' }),
    },
    query: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
    synchronize: jest.fn(),
    getMetadata: jest.fn(() => ({ tableName: 'mock_table' })),
  };

  beforeEach(async () => {
    // Clear mocks to ensure test isolation
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeederService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SeederService>(SeederService);
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should run the seed transaction successfully', async () => {
    await service.seed();

    expect(mockDataSource.synchronize).toHaveBeenCalledWith(true);
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();

    // Verify interactions
    expect(mockQueryRunner.manager.save).toHaveBeenCalled();

    expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });

  it('should rollback transaction on error', async () => {
    // LOGIC FIX: We make 'save' fail. 
    // If 'synchronize' failed, the transaction wouldn't even start, 
    // so rollbackTransaction would never be called.
    mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('DB Error'));

    await expect(service.seed()).rejects.toThrow('DB Error');

    // Now we can verify the transaction safety net worked
    expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalled();
  });
});
