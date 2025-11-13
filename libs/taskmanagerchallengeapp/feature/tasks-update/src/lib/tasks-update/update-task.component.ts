// /workspace-root/libs/app/feature/tasks-update/lib/update-task.component.ts

import { ChangeDetectionStrategy, Component, OnInit, signal, inject, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TasksService } from '../../../../../data-access/api-task-manager/src/lib/services/tasks.service';
import { UsersService } from '../../../../../data-access/api-task-manager/src/lib/services/users.service';
import { Task, UpdateTaskDto } from '../../../../../data-access/api-task-manager/src/lib/models/task.model';
import { UserProfileResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { HasPermissionDirective } from '../../../../../shared/util-auth/src/lib/directives/has-permission.directive';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { switchMap, finalize, catchError, of, forkJoin } from 'rxjs';

/**
 * Component for updating an existing task.
 * It handles fetching task details, fetching available users for assignment,
 * and submitting the updated task data to the API.
 */
@Component({
  selector: 'app-update-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HasPermissionDirective],
  templateUrl: './update-task.component.html',
  styleUrl: './update-task.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateTaskComponent implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly usersService = inject(UsersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly authService = inject(AuthService);

  // --- State Signals ---
  /** Stores the fetched task details */
  public taskDetails: WritableSignal<Task | null> = signal(null);
  /** Stores the list of all users for assignment dropdown */
  public users: WritableSignal<UserProfileResponse[]> = signal([]);
  public loading: WritableSignal<boolean> = signal(true);
  public isSaving: WritableSignal<boolean> = signal(false);
  public errorMessage: WritableSignal<string | null> = signal(null);

  // --- Form Signals (Bind directly to ngModel in template) ---
  public taskId: WritableSignal<number | null> = signal(null);
  public title: WritableSignal<string> = signal('');
  public description: WritableSignal<string> = signal('');
  public isCompleted: WritableSignal<boolean> = signal(false);
  public assignedUserId: WritableSignal<number | null> = signal(null);

  // --- Computed Signals for Authorization (ABAC) ---
  private currentUserId = computed(() => this.authService.currentUser()?.userId);
  private userPermissions = this.authService.userPermissions;

  /** Checks if the current user is the creator of the task, used for core edit access. */
  public isTaskCreator: Signal<boolean> = computed(() => {
    return this.taskDetails()?.creatorId === this.currentUserId();
  });

  /** Determines if the user can edit core task fields (title/description/assignment). 
   * Rule: Must have 'update:own:tasks' permission AND be the creator (ABAC). 
   */
  public canEditCoreDetails: Signal<boolean> = computed(() => {
    const isCreator = this.isTaskCreator();
    const hasPermission = this.userPermissions().includes('update:own:tasks');
    return hasPermission && isCreator;
  });

  /** Determines if the user can change the completion status.
   * Rule: Must be the assigned user AND have the necessary mark/unmark permission.
   */
  public canToggleCompletion: Signal<boolean> = computed(() => {
    const task = this.taskDetails();
    if (!task) return false;

    // Must be assigned to the current user
    const isAssigned = task.assignedUserId === this.currentUserId();

    if (!isAssigned) return false;

    // Must have the specific permission based on current completion state
    const requiredPermission = this.isCompleted() ? 'unmark:assigned:tasks' : 'mark:assigned:tasks';
    return this.userPermissions().includes(requiredPermission);
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(
      // 1. Get the task ID from the route parameters
      switchMap(params => {
        const id = Number(params.get('id'));
        if (isNaN(id)) {
          this.errorMessage.set('Invalid task ID provided.');
          this.loading.set(false);
          return of(null);
        }
        this.taskId.set(id);
        this.logger.log(`Fetching task details for ID: ${id}`);

        // 2. Fetch both task details and the list of users concurrently
        return forkJoin({
          task: this.tasksService.getTask(id).pipe(
            catchError(err => {
              this.logger.error('Error fetching task details.', err);
              this.errorMessage.set(`Failed to load task details: ${err.statusText || 'Server error'}. Check permissions.`);
              return of(null);
            })
          ),
          users: this.usersService.getAllUsers().pipe(
            catchError(err => {
              this.logger.error('Error fetching users list.', err);
              // Allow task details to load even if user list fails
              return of([]);
            })
          )
        });
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(result => {
      if (result && result.task) {
        this.taskDetails.set(result.task);
        this.users.set(result.users);
        this.initializeForm(result.task);
      } else if (result && !this.errorMessage()) {
        // Handle case where task fetch failed but error message wasn't set (e.g., 404, 403)
        this.errorMessage.set('Task details could not be loaded.');
      }
    });
  }

  /**
   * Initializes the form signals with the fetched task data.
   */
  private initializeForm(task: Task): void {
    this.title.set(task.title);
    this.description.set(task.description || '');
    this.isCompleted.set(task.isCompleted);
    this.assignedUserId.set(task.assignedUserId);
  }

  /**
   * Handles the form submission for core task details update (title, description, assignment).
   */
  public onSubmit(): void {
    if (!this.canEditCoreDetails()) {
      this.errorMessage.set('You do not have permission to modify this task\'s core details (title, description, assignment).');
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    const id = this.taskId();
    if (id === null) return;

    // Only include fields that are part of the core update DTO
    const updateDto: UpdateTaskDto = {
      title: this.title(),
      description: this.description(),
      assignedUserId: this.assignedUserId(),
      // isCompleted is included here, although primary toggle is handled by onCompletionToggle
      isCompleted: this.isCompleted()
    };

    this.tasksService.updateTask(id, updateDto).pipe(
      finalize(() => this.isSaving.set(false)),
      catchError(err => {
        this.logger.error(`Failed to update task ${id}`, err);
        this.errorMessage.set(`Core update failed: ${err.error?.message || 'Server error.'}`);
        return of(null);
      })
    ).subscribe(updatedTask => {
      if (updatedTask) {
        this.logger.info(`Task ${id} successfully updated.`);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  /**
   * Handles completion toggle status, specifically checking the ABAC policy 
   * that the user must be the assigned user AND have the mark/unmark permission.
   * This is triggered by the checkbox click in the template.
   */
  public onCompletionToggle(newStatus: boolean): void {
    const id = this.taskId();

    if (id === null) {
      this.errorMessage.set('Task ID is missing.');
      return;
    }

    if (!this.canToggleCompletion()) {
      this.errorMessage.set(`You do not have permission to mark this task as ${newStatus ? 'complete' : 'incomplete'}. You must be the assigned user and have the correct role.`);
      // Revert the checkbox state if unauthorized
      this.isCompleted.set(!newStatus);
      return;
    }

    this.isSaving.set(true);
    const updateDto: UpdateTaskDto = { isCompleted: newStatus };

    // Use the standard updateTask service call
    this.tasksService.updateTask(id, updateDto).pipe(
      finalize(() => this.isSaving.set(false)),
      catchError(err => {
        this.logger.error(`Failed to toggle task ${id} completion status`, err);
        this.errorMessage.set(`Status toggle failed: ${err.error?.message || 'Server error.'}`);
        // Revert UI state if API call fails
        this.isCompleted.set(!newStatus);
        return of(null);
      })
    ).subscribe(updatedTask => {
      if (updatedTask) {
        this.logger.info(`Task ${id} completion status set to ${newStatus}.`);
        this.isCompleted.set(updatedTask.isCompleted);
      }
    });
  }

  /**
   * Navigates back to the dashboard.
   */
  public onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
