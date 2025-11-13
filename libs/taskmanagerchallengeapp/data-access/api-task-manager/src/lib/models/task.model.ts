// /workspace-root/libs/app/data-access/api-task-manager/lib/models/task.model.ts

import { UserProfileResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';

// Task model representing the structure of a single task from the backend
export interface Task {
  taskId: number;
  title: string;
  description: string;
  creatorId: number;
  // Details of the task creator (fetched by the backend)
  creator: UserProfileResponse;
  // Nullable ID for unassigned tasks
  assignedUserId: number | null;
  // Details of the assigned user (will be null if assignedUserId is null)
  assignedUser: UserProfileResponse | null;
  isCompleted: boolean;
  createdAt: string; // ISO date string
  completedAt: string | null; // ISO date string or null
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
