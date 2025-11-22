// /workspace-root/libs/api/auth/repositories/refresh-tokens.repository.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokensRepository } from './refresh-tokens.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '../../../../data-access/src/lib/entities/refresh-token.entity';
import { Repository } from 'typeorm';

describe('RefreshTokensRepository', () => {
  let repository: RefreshTokensRepository;
  let typeOrmRepo: Repository<RefreshTokenEntity>;

  const mockTypeOrmRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(), // Added delete in case you test revocation by deletion later
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensRepository,
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: mockTypeOrmRepo,
        },
      ],
    }).compile();

    repository = module.get<RefreshTokensRepository>(RefreshTokensRepository);
    typeOrmRepo = module.get<Repository<RefreshTokenEntity>>(getRepositoryToken(RefreshTokenEntity));

    jest.clearAllMocks();
  });

  it('should return false if token not found during validation', async () => {
    mockTypeOrmRepo.findOne.mockResolvedValue(null);

    const result = await repository.validateAndRevokeToken(1, 'rawToken');

    expect(result).toBe(false);
  });

  it('should validate and revoke a valid token', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    // Mock finding a valid, unexpired token
    mockTypeOrmRepo.findOne.mockResolvedValue({
      tokenId: 1,
      expiresAt: futureDate,
      isRevoked: false
    });

    mockTypeOrmRepo.update.mockResolvedValue({});

    const result = await repository.validateAndRevokeToken(1, 'rawToken');

    expect(result).toBe(true);
    // Verify the flag was flipped to true in the DB
    expect(typeOrmRepo.update).toHaveBeenCalledWith({ tokenId: 1 }, { isRevoked: true });
  });
});
