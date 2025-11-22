// /workspace-root/libs/api/tasks/guards/task-ownership.guard.spec.ts

import { TaskOwnershipGuard } from './task-ownership.guard';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TaskOwnershipGuard', () => {
  let guard: TaskOwnershipGuard;

  const mockTasksService = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new TaskOwnershipGuard(mockTasksService as any);
  });

  const createMockContext = (params: any, user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ params, user }),
    }),
  } as any);

  it('should grant access if user is creator', async () => {
    mockTasksService.findOne.mockResolvedValue({ taskId: 1, creatorId: 100 });
    const context = createMockContext({ id: '1' }, { userId: 100 });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user is not creator', async () => {
    mockTasksService.findOne.mockResolvedValue({ taskId: 1, creatorId: 999 });
    const context = createMockContext({ id: '1' }, { userId: 100 });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if task does not exist', async () => {
    // Mock returning null (simulating service behavior or explicit null return)
    mockTasksService.findOne.mockResolvedValue(null);
    const context = createMockContext({ id: '999' }, { userId: 1 });

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });
});
