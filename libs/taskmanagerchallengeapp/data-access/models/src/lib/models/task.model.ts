export interface Task {
  id: number;
  title: string;
  description: string | null;
  isCompleted: boolean;

  creatorUserId: number;

  assignment: TaskAssignment | null;

  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignment {
  id: number;
  taskId: number;
  assignedUserId: number;

  assignedUser?: {
    localUserId: number;
    nickname: string | null;
  };
}
