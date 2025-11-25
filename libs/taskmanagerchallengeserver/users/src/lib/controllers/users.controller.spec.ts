import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { UserProfileDto } from '../dtos/user-profile.dto';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getProfile: jest.fn(),
    getAllUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      const mockProfile: UserProfileDto = { userId: 1, email: 'test@test.com', createdAt: new Date() };
      mockUsersService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile({ userId: 1 });
      expect(result).toEqual(mockProfile);
      expect(service.getProfile).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if service throws it', async () => {
      mockUsersService.getProfile.mockRejectedValue(new NotFoundException());
      await expect(controller.getProfile({ userId: 99 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllUsers', () => {
    it('should return an array of user profiles', async () => {
      const mockProfiles: UserProfileDto[] = [
        { userId: 1, email: 'test@test.com', createdAt: new Date() },
        { userId: 2, email: 'test2@test.com', createdAt: new Date() }
      ];
      mockUsersService.getAllUsers.mockResolvedValue(mockProfiles);

      const result = await controller.getAllUsers();
      expect(result).toEqual(mockProfiles);
    });
  });
});
