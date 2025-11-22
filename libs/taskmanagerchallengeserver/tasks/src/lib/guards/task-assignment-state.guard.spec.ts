// /workspace-root/libs/api/tasks/guards/task-assignment-state.guard.spec.ts

import { TaskAssignmentStateGuard } from './task-assignment-state.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('TaskAssignmentStateGuard', () => {
  let guard: TaskAssignmentStateGuard;
  const mockTasksService = { findOne: jest.fn() };

  beforeEach(() => {
    guard = new TaskAssignmentStateGuard(mockTasksService as any);
  });

  const createMockContext = (url: string, params: any, user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ url, params, user }),
    }),
  } as any);

  it('should ALLOW assigning an unassigned task', async () => {
    // Mock task as UNASSIGNED
    mockTasksService.findOne.mockResolvedValue({ assignedUserId: null, assignedUser: null });
    const context = createMockContext('/tasks/1/assign', { id: '1' }, { userId: 1 });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should THROW when assigning an already assigned task', async () => {
    // Mock task as ASSIGNED
    mockTasksService.findOne.mockResolvedValue({ assignedUserId: 5, assignedUser: { userId: 5 } });
    const context = createMockContext('/tasks/1/assign', { id: '1' }, { userId: 1 });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should ALLOW unassigning an assigned task', async () => {
    // Mock task as ASSIGNED
    mockTasksService.findOne.mockResolvedValue({ assignedUserId: 5, assignedUser: { userId: 5 } });
    const context = createMockContext('/tasks/1/unassign', { id: '1' }, { userId: 1 });

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should THROW when unassigning an already unassigned task', async () => {
    // Mock task as UNASSIGNED
    mockTasksService.findOne.mockResolvedValue({ assignedUserId: null, assignedUser: null });
    const context = createMockContext('/tasks/1/unassign', { id: '1' }, { userId: 1 });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
