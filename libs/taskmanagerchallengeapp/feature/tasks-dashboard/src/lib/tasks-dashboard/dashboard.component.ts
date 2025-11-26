import { Component, inject, signal, WritableSignal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TasksService } from '../../../../../data-access/api-task-manager/src/lib/services/tasks.service';
import { UsersService } from '../../../../../data-access/api-task-manager/src/lib/services/users.service';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { HasPermissionDirective } from '../../../../../shared/util-auth/src/lib/directives/has-permission.directive';
import { Task, TaskListResponse, TaskFilterQuery } from '../../../../../data-access/api-task-manager/src/lib/models/task.model';
import { UserProfileResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';
import { catchError, finalize, of, tap } from 'rxjs';

const INITIAL_TASK_STATE: TaskListResponse = {
  tasks: [],
  total: 0,
  page: 1,
  limit: 10,
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HasPermissionDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  public Math = Math;
  private readonly taskService = inject(TasksService);
  private readonly userService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  public taskState: WritableSignal<TaskListResponse> = signal(INITIAL_TASK_STATE);
  public isLoading: WritableSignal<boolean> = signal(false);
  public users: WritableSignal<UserProfileResponse[]> = signal([]);
  public errorMessage: WritableSignal<string | null> = signal(null);

  public currentPage: WritableSignal<number> = signal(1);
  public tasksPerPage: WritableSignal<number> = signal(10);
  public filterStatus = signal<TaskFilterQuery['completionFilter']>('all');
  public filterAssignment = signal<TaskFilterQuery['assignmentFilter']>('all');

  public totalPages = signal(0);
  public paginationRange = signal<number[]>([]);
  public currentUser = this.authService.currentUser;
  public userPermissions = this.authService.userPermissions;

  ngOnInit(): void {
    this.logger.info('DashboardComponent initialized. Fetching data.');
    this.fetchTasks();
    this.fetchUsers();
  }

  /**
   * Constructs the query and fetches tasks from the API.
   */
  fetchTasks(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const query: TaskFilterQuery = {
      page: this.currentPage(),
      limit: this.tasksPerPage(),
      completionFilter: this.filterAssignment() === 'unassigned' ?  undefined : this.filterStatus(),
      assignmentFilter: this.filterAssignment(),
    };

    this.logger.debug('Task query built:', query);
    this.taskService.getTasks(query).pipe(
      tap((response) => {
        this.taskState.set(response);
        this.updatePagination(response.total, response.limit, response.page);
        this.logger.log(`Tasks loaded successfully. Total: ${response.total}`);
      }),
      catchError((error) => {
        this.logger.error('Failed to fetch tasks.', error);
        this.errorMessage.set('Could not load tasks. Please try again or check permissions (read:tasks).');
        this.taskState.set(INITIAL_TASK_STATE);
        return of(INITIAL_TASK_STATE);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe();
  }

  /**
   * Fetches all users for the assign/unassign dropdowns.
   */
  fetchUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.logger.debug(`Loaded ${users.length} users.`);
      },
      error: (err) => {
        this.logger.error('Failed to fetch user list for assignment.', err);
      },
    });
  }

  /**
   * Updates pagination state.
   */
  updatePagination(total: number, limit: number, page: number): void {
    const pages = Math.ceil(total / limit);
    this.totalPages.set(pages);

    const range: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    if (startPage > 1) {
      range.unshift(1);
      if (startPage > 2) range.splice(1, 0, 0);
    }
    if (endPage < pages) {
      if (endPage < pages - 1) range.push(0);
      range.push(pages);
    }

    this.paginationRange.set(range.filter((value, index, self) => value !== 0 || self[index - 1] !== 0));
    this.currentPage.set(page);
  }

  /**
   * Changes the current page and re-fetches tasks.
   */
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.fetchTasks();
  }

  /**
   * Handles filter change and resets to page 1.
   */
  onFilterChange(): void {
    this.currentPage.set(1);
    this.fetchTasks();
  }

  /**
   * Toggles the completion status of a task.
   */
  onToggleCompletion(task: Task): void {
    const newCompletionStatus = !task.isCompleted;

    const requiredPermission = newCompletionStatus ? 'mark:assigned:tasks' : 'unmark:assigned:tasks';

    if (!this.userPermissions().includes(requiredPermission)) {
      this.errorMessage.set(`Permission denied: You need '${requiredPermission}' to perform this action.`);
      this.logger.warn(`User tried to toggle completion without '${requiredPermission}'.`);
      return;
    }

    this.taskService.updateTask(task.taskId, { isCompleted: newCompletionStatus }).pipe(
      catchError((err) => {
        this.fetchTasks();
        this.errorMessage.set(`Failed to change task status. Check if you are the assigned user and have permission ('mark:assigned:tasks' or 'unmark:assigned:tasks').`);
        this.logger.error(`Failed to toggle completion for task ${task.taskId}.`, err);
        return of(null);
      })
    ).subscribe((updatedTask) => {
      if (updatedTask) {
        this.taskState.update(state => ({
          ...state,
          tasks: state.tasks.map(t => t.taskId === updatedTask.taskId ? updatedTask : t)
        }));
        this.logger.log(`Task ${updatedTask.taskId} marked as ${updatedTask.isCompleted ? 'completed' : 'incomplete'}.`);
      }
    });
  }

  /**
   * Handles task deletion.
   * Requires 'delete:own:tasks' permission AND ownership (ABAC).
   */
  onDeleteTask(task: Task): void {
    const requiredPermission = 'delete:own:tasks';

    if (!this.userPermissions().includes(requiredPermission)) {
      this.errorMessage.set(`Permission denied: You need '${requiredPermission}' to perform this action.`);
      this.logger.warn(`User tried to delete task ${task.taskId} without '${requiredPermission}'.`);
      return;
    }

    if (!this.isCreator(task)) {
      this.errorMessage.set(`Permission denied: Only the creator of task ${task.taskId} can delete it (delete:own:tasks).`);
      this.logger.warn(`User ${this.currentUser()?.userId} tried to delete task ${task.taskId} but is not the creator.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete task: ${task.title}? This action is permanent.`)) {
      return;
    }

    this.taskService.deleteTask(task.taskId).pipe(
      tap(() => this.logger.warn(`Task ${task.taskId} successfully deleted.`)),
      catchError((err) => {
        this.logger.error(`Failed to delete task ${task.taskId}.`, err);
        this.errorMessage.set(`Deletion failed: ${err.error?.message || 'Server error.'}. Check permissions and ownership.`);
        return of(null);
      })
    ).subscribe(() => {
      this.fetchTasks();
    });
  }

  /**
   * Utility to check if the current user is the assigned user.
   */
  isAssignedUser(task: Task): boolean {
    return task.assignedUserId === this.currentUser()?.userId;
  }

  /**
   * Navigates to the Edit Task page.
   */
  onEditTask(taskId: number): void {
    this.router.navigate(['/tasks/update', taskId]);
  }

  /**
   * Navigates to the View Task page.
   */
  onViewTask(taskId: number): void {
    this.router.navigate(['/tasks/view', taskId]);
  }

  /**
   * Checks if the user is the creator of the task.
   */
  isCreator(task: Task): boolean {
    return task.creatorId === this.currentUser()?.userId;
  }
}
