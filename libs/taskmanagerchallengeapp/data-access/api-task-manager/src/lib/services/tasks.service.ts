import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import {
  Task,
  TaskListResponse,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterQuery,
} from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly API_URL = '/api/tasks';

  /**
   * Fetches a paginated and filtered list of tasks (GET /api/tasks).
   */
  getTasks(query: TaskFilterQuery): Observable<TaskListResponse> {
    this.logger.log('Fetching tasks with query.', query);

    let params = new HttpParams();
    Object.keys(query).forEach((key) => {
      const value = query[key as keyof TaskFilterQuery];
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<TaskListResponse>(this.API_URL, { params });
  }

  /**
   * Fetches details for a single task (GET /api/tasks/:id).
   */
  getTask(taskId: number): Observable<Task> {
    this.logger.log(`Fetching task details for ID: ${taskId}.`);
    return this.http.get<Task>(`${this.API_URL}/${taskId}`);
  }

  /**
   * Creates a new task (POST /api/tasks).
   */
  createTask(dto: CreateTaskDto): Observable<Task> {
    this.logger.log('Creating new task.', dto);
    return this.http.post<Task>(this.API_URL, dto);
  }

  /**
   * Updates an existing task (PATCH /api/tasks/:id).
   * Used for title/description/assignment/completion toggle.
   */
  updateTask(taskId: number, dto: UpdateTaskDto): Observable<Task> {
    this.logger.log(`Updating task ID: ${taskId}.`, dto);
    return this.http.patch<Task>(`${this.API_URL}/${taskId}`, dto);
  }

  /**
   * Deletes a task (DELETE /api/tasks/:id).
   */
  deleteTask(taskId: number): Observable<void> {
    this.logger.warn(`Deleting task ID: ${taskId}.`);
    return this.http.delete<void>(`${this.API_URL}/${taskId}`);
  }
}


