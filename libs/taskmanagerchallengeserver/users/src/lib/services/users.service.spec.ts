import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from '../repositories/users.repository';
import { NotFoundException, Logger } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockDate = new Date();
  const mockUserEntity = {
    userId: 1,
    email: 'test@example.com',
    passwordHash: 'hashed_secret',
    createdAt: mockDate,
  };

  const mockUsersRepository = {
    findOneById: jest.fn(),
    findOneByEmail: jest.fn(),
    getUserRolesAndPermissions: jest.fn(),
    findAllProfiles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);

  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('should return a simplified UserProfile when user exists', async () => {
      mockUsersRepository.findOneById.mockResolvedValue(mockUserEntity);

      const result = await service.getById(1);

      expect(repository.findOneById).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        userId: 1,
        email: 'test@example.com',
        createdAt: mockDate,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null and log a warning if user does not exist', async () => {
      mockUsersRepository.findOneById.mockResolvedValue(null);

      const result = await service.getById(99);

      expect(repository.findOneById).toHaveBeenCalledWith(99);
      expect(result).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('should return UserDetails (including hash) when user exists', async () => {
      mockUsersRepository.findOneByEmail.mockResolvedValue(mockUserEntity);

      const result = await service.getByEmail('test@example.com');

      expect(repository.findOneByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({
        userId: 1,
        email: 'test@example.com',
        passwordHash: 'hashed_secret',
      });
    });

    it('should return null if user does not exist', async () => {
      mockUsersRepository.findOneByEmail.mockResolvedValue(null);

      const result = await service.getByEmail('missing@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getPermissionsForUser', () => {
    it('should return the permissions string from the repository', async () => {
      const mockPerms = 'READ,WRITE,admin';
      mockUsersRepository.getUserRolesAndPermissions.mockResolvedValue(mockPerms);

      const result = await service.getPermissionsForUser(1);

      expect(repository.getUserRolesAndPermissions).toHaveBeenCalledWith(1);
      expect(result).toBe(mockPerms);
    });
  });

  describe('getProfile', () => {
    it('should return the profile if the user exists', async () => {
      mockUsersRepository.findOneById.mockResolvedValue(mockUserEntity);

      const result = await service.getProfile(1);

      expect(result).toEqual({
        userId: 1,
        email: 'test@example.com',
        createdAt: mockDate,
      });
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      mockUsersRepository.findOneById.mockResolvedValue(null);

      await expect(service.getProfile(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllUsers', () => {
    it('should return an array of UserProfiles mapped from entities', async () => {
      const mockEntities = [
        mockUserEntity,
        { ...mockUserEntity, userId: 2, email: 'test2@example.com' },
      ];
      mockUsersRepository.findAllProfiles.mockResolvedValue(mockEntities);

      const result = await service.getAllUsers();

      expect(repository.findAllProfiles).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        userId: 1,
        email: 'test@example.com',
        createdAt: mockDate,
      });
      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });
});
