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

// DTO for task list response (used on Dashboard)
export interface TaskListResponse {
  tasks: Task[]; // The array of tasks
  total: number; // Total number of tasks matching the filter/query
  page: number;
  limit: number;
}

// DTO for creating a task (Add Task page)
export interface CreateTaskDto {
  title: string;
  description: string;
  // Optional, defaults to unassigned (handled by the backend)
  assignedUserId?: number | null;
}

// DTO for updating a task (Update Task page)
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  isCompleted?: boolean;
  // Null means unassign
  assignedUserId?: number | null;
}

// Query parameters for the dashboard list
export interface TaskFilterQuery {
  page?: number;
  limit?: number;
  // Filter by assignment status
  assignmentFilter?: 'all' | 'assigned' | 'unassigned';
  // Filter by completion status (only used if assignmentFilter is not 'unassigned')
  completionFilter?: 'all' | 'completed' | 'incomplete';
  // Optional search term
  search?: string;
}
