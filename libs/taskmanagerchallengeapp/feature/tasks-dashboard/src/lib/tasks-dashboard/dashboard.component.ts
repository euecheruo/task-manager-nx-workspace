// /workspace-root/libs/app/feature/tasks-dashboard/lib/dashboard.component.ts

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

// Initial state for task dashboard
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
  // EXPOSE JAVASCRIPT'S MATH OBJECT TO THE TEMPLATE for min/ceil calculations
  public Math = Math;

  private readonly taskService = inject(TasksService);
  private readonly userService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  // --- UI State Signals ---
  public taskState: WritableSignal<TaskListResponse> = signal(INITIAL_TASK_STATE);
  public isLoading: WritableSignal<boolean> = signal(false);
  public users: WritableSignal<UserProfileResponse[]> = signal([]);
  public errorMessage: WritableSignal<string | null> = signal(null);

  // --- Filter State Signals ---
  public currentPage: WritableSignal<number> = signal(1);
  public tasksPerPage: WritableSignal<number> = signal(10);
  public filterStatus: WritableSignal<TaskFilterQuery['completionFilter']> = signal('all');
  public filterAssignment: WritableSignal<TaskFilterQuery['assignmentFilter']> = signal('assigned');

  // --- Pagination Logic ---
  public totalPages = signal(0);
  public paginationRange = signal<number[]>([]);

  // --- Utility Accessors ---
  public currentUser = this.authService.currentUser;
  public userPermissions = this.authService.userPermissions;

  ngOnInit(): void {
    this.logger.info('DashboardComponent initialized. Fetching data.');
    this.fetchTasks();
    this.fetchUsers(); // Get list of users for assignment options
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
      // Only include completion filter if assignment filter is not 'unassigned'
      completionFilter: this.filterAssignment() === 'unassigned' ? undefined : this.filterStatus(),
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
        this.errorMessage.set('Could not load tasks. Please try again or check permissions.');
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

    // Logic to create a pagination range with ellipsis (simplified)
    const range: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }

    // Simple ellipsis logic
    if (startPage > 1) {
      range.unshift(1);
      if (startPage > 2) range.splice(1, 0, 0); // 0 is placeholder for ellipsis
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

    // Determine required permission based on intended action
    const requiredPermission = newCompletionStatus ? 'mark:assigned:tasks' : 'unmark:assigned:tasks';

    if (!this.userPermissions().includes(requiredPermission)) {
      // NOTE: This client-side check is technically redundant as the server performs the authoritative check, 
      // but it provides a better UX by giving instant feedback.
      this.errorMessage.set(`Permission denied: You need '${requiredPermission}' to perform this action.`);
      this.logger.warn(`User tried to toggle completion without '${requiredPermission}'.`);
      return;
    }

    this.taskService.updateTask(task.taskId, { isCompleted: newCompletionStatus }).pipe(
      catchError((err) => {
      this.logger.error(`Failed to toggle completion for task ${task.taskId}.`, err);
      this.errorMessage.set(`Failed to change task status. Check if you are the assigned user and have permission.`);
      this.fetchTasks(); // Re-fetch to revert the UI state to actual state
      return of(null);
    })
    ).subscribe((updatedTask) => {
      if (updatedTask) {
        // Update the task list in place to reflect the change
        this.taskState.update(state => ({
          ...state,
          tasks: state.tasks.map(t => t.taskId === updatedTask.taskId ? updatedTask : t)
          
        }));
        this.logger.log(`Task ${updatedTask.taskId} marked as ${updatedTask.isCompleted ? 'completed' : 'incomplete'}.`);
      }
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
   * Assigns an unassigned task to a selected user.
   */
  onAssignTask(task: Task, selectElement: HTMLSelectElement): void {
    const assignedUserId = parseInt(selectElement.value, 10);
    if (isNaN(assignedUserId)) return;

    // Client-side permission check (server will double-check state and permission)
    if (!this.userPermissions().includes('assign:tasks')) {
      this.errorMessage.set(`Permission denied: You need 'assign:tasks' permission.`);
      return;
    }
    // The DTO property is `assignedUserId` for general updates in the backend.
    this.taskService.updateTask(task.taskId, { assignedUserId }).pipe(
      tap(() => this.logger.log(`Task ${task.taskId} assigned to user ${assignedUserId}.`)),
      catchError((err) => {
        this.logger.error(`Failed to assign task ${task.taskId}.`, err);
        this.errorMessage.set(`Failed to assign task. Check permissions or if task is already assigned.`);
        return of(null);
      })
    ).subscribe((updatedTask) => {
      if (updatedTask) {
        this.fetchTasks(); // Refresh the entire table 
      }
    });
  }

  /**
   * Unassigns an assigned task.
   */
  onUnassignTask(task: Task): void {
    
    // Client-side permission check
    if (!this.userPermissions().includes('unassign:tasks')) {
      this.errorMessage.set(`Permission denied: You need 'unassign:tasks' permission.`);
      return;
    }
    // The DTO property is `assignedUserId` (set to null) for unassignment.
    this.taskService.updateTask(task.taskId, { assignedUserId: null }).pipe(
      tap(() => this.logger.log(`Task ${task.taskId} unassigned.`)),
      catchError((err) => {
        this.logger.error(`Failed to unassign task ${task.taskId}.`, err);
        this.errorMessage.set(`Failed to unassign task. Check permissions or if task is already unassigned.`);
        return of(null);
      })
    ).subscribe((updatedTask) => {
      if (updatedTask) {
        this.fetchTasks(); // Refresh the entire table
      }
    });
  }

  /**
   * Checks if the user is the creator of the task.
   */
  isCreator(task: Task): boolean {
      return task.creatorId === this.currentUser()?.userId;
  }
}
