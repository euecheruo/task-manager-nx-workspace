export interface TaskData {
  taskId: number;
  
  title: string;
  
  description?: string;
  
  creatorId: number;
  
  assignedUserId: number | null;

  isCompleted: boolean;
  
  createdAt: Date;
  
  completedAt: Date | null;
}
