import { UserProfileResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';

export interface Task {
  taskId: number;
  title: string;
  description: string;
  creatorId: number;
  creator: UserProfileResponse;
  assignedUserId: number | null;
  assignedUser: UserProfileResponse | null;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  assignedUserId?: number | null;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  assignedUserId?: number | null;
}

export interface TaskFilterQuery {
  page?: number;
  limit?: number;
  assignmentFilter?: 'all' | 'assigned' | 'unassigned';
  completionFilter?: 'all' | 'completed' | 'incomplete';
  search?: string;
}
