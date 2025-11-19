// /workspace-root/libs/app/feature/tasks-update/lib/update-task.component.ts

import { ChangeDetectionStrategy, Component, OnInit, signal, inject, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, ParamMap } from '@angular/router';
import { TasksService } from '../../../../../data-access/api-task-manager/src/lib/services/tasks.service';
import { UsersService } from '../../../../../data-access/api-task-manager/src/lib/services/users.service';
import { Task, UpdateTaskDto } from '../../../../../data-access/api-task-manager/src/lib/models/task.model';
import { UserProfileResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { HasPermissionDirective } from '../../../../../shared/util-auth/src/lib/directives/has-permission.directive';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { switchMap, finalize, catchError, of, map } from 'rxjs';

/**
 * Component for updating an existing task.
 * It handles fetching task details, fetching available users for assignment,
 * and submitting the updated task data to the API.
 */
@Component({
  selector: 'app-update-task',
  standalone: true,
  // FIX: Added missing imports list
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

  /**
   * Stores the fetched task details
   */
  public taskDetails: WritableSignal<Task | null> = signal(null);

  /**
   * Stores the list of all users for assignment dropdown
   */
  // FIX: Corrected type from UserProfileResponse to UserProfileResponse[] (array)
  public users: WritableSignal<UserProfileResponse[]> = signal([]);
  public loading: WritableSignal<boolean> = signal(true);
  public isSaving: WritableSignal<boolean> = signal(false);
  public errorMessage: WritableSignal<string | null> = signal(null);
  public taskId: WritableSignal<number | null> = signal(null);
  public title: WritableSignal<string> = signal('');
  public description: WritableSignal<string> = signal('');
  public isCompleted: WritableSignal<boolean> = signal(false);
  public assignedUserId: WritableSignal<number | null> = signal(null);

  private currentUserId = computed(() => this.authService.currentUser()?.userId);
  // userPermissions is correctly public
  public userPermissions = this.authService.userPermissions;

  /**
   * Checks if the current user is the creator of the task, used for core edit access.
   */
  public isTaskCreator: Signal<boolean> = computed(() => {
    return this.taskDetails()?.creatorId === this.currentUserId();
  });
  /**
   * Determines if the user can edit core task fields (title/description/assignment).
   * Rule: Must have 'update:own:tasks' permission AND be the creator (ABAC).
   */
  public canEditCoreDetails: Signal<boolean> = computed(() => {
    const isCreator = this.isTaskCreator();
    const hasPermission = this.userPermissions().includes('update:own:tasks');
    return hasPermission && isCreator;
  });
  /**
   * Determines if the user can change the completion status.
   * Rule: Must be the assigned user AND have the necessary mark/unmark permission.
   */
  public canToggleCompletion: Signal<boolean> = computed(() => {
    const task = this.taskDetails();
    if (!task) return false;

    const isAssigned = task.assignedUserId === this.currentUserId();

    if (!isAssigned) return false;

    const requiredPermission = this.isCompleted() ? 'unmark:assigned:tasks' : 'mark:assigned:tasks';
    return this.userPermissions().includes(requiredPermission);
  });

  ngOnInit(): void {
    // Both fetch operations are initiated concurrently.
    this.fetchUsers();
    this.fetchTask();
  }

  /**
   * Fetches the static list of users for assignment.
   */
  private fetchUsers(): void {
    this.usersService.getAllUsers().pipe(
      catchError(err => {
        this.logger.error('Error fetching users list.', err);
        // FIX: Return an empty array of users on error, ensuring stream completion
        return of([]);
      })
    ).subscribe(users => {
      this.users.set(users);
    });
  }

  /**
   * Fetches the task details based on the route parameter ID.
   * Uses switchMap on paramMap to handle dynamic route changes (though unlikely here).
   */
  private fetchTask(): void {
    this.route.paramMap.pipe(
      // Use switchMap to cancel previous request if paramMap emits rapidly
      switchMap((params: ParamMap) => {
        const id = Number(params.get('id'));

        if (isNaN(id)) {
          this.errorMessage.set('Invalid task ID provided.');
          this.loading.set(false);
          return of(null);
        }

        this.taskId.set(id);
        this.logger.log(`Fetching task details for ID: ${id}`);
        // Only set loading to true here, set to false in finalize.
        this.loading.set(true);
        this.errorMessage.set(null);

        return this.tasksService.getTask(id).pipe(
          catchError(err => {
            this.logger.error('Error fetching task details.', err);
            this.errorMessage.set(`Failed to load task details: ${err.statusText || 'Server error'}. Check permissions (read:tasks).`);
            return of(null);
          })
        );
      }),
      // Ensure loading is set to false after stream completes or errors
      finalize(() => this.loading.set(false))
    ).subscribe(task => {
      this.loading.set(false);
      if (task) {
        this.taskDetails.set(task);
        this.initializeForm(task);
      } else if (this.taskId() !== null && !this.errorMessage()) {
        // Only set a generic error if we had a valid ID but got no task and no specific error was logged
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
      // FIX: Added explicit permission rule to error message
      this.errorMessage.set('You do not have permission to modify this task\'s core details (title, description, assignment). You must be the task creator and possess the \'update:own:tasks\' permission.');
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    const id = this.taskId();
    if (id === null) return;
    const updateDto: UpdateTaskDto = {
      title: this.title(),
      description: this.description(),
      assignedUserId: this.assignedUserId(),
      isCompleted: this.isCompleted()
    };
    this.tasksService.updateTask(id, updateDto).pipe(
      finalize(() => this.isSaving.set(false)),
      catchError(err => {
        this.logger.error(`Failed to update task ${id}`, err);
        // FIX: Added explicit permission rule to error message
        this.errorMessage.set(`Core update failed: ${err.error?.message || 'Server error.'}. Check if you are the creator and have the 'update:own:tasks' permission.`);
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
   * Deletes a task.
   */
  public onDelete(): void {
    const requiredPermission = 'delete:own:tasks';
    if (!this.isTaskCreator() || !this.userPermissions().includes(requiredPermission)) {
      // FIX: Added explicit permission rule to error message
      this.errorMessage.set(`Permission denied: You need to be the task creator and have the '${requiredPermission}' permission.`);
      return;
    }

    const id = this.taskId();
    if (id === null) return;
    if (!window.confirm(`Are you sure you want to delete task ID: ${id}? This action is permanent.`)) {
      return;
    }

    this.isSaving.set(true);

    this.tasksService.deleteTask(id).pipe(
      finalize(() => this.isSaving.set(false)),
      catchError(err => {
        this.logger.error(`Failed to delete task ${id}`, err);
        // FIX: Added explicit permission rule to error message
        this.errorMessage.set(`Deletion failed: ${err.error?.message || 'Server error.'}. Check if you are the creator and have the '${requiredPermission}' permission.`);
        return of(null);
      })
    ).subscribe(() => {
      this.logger.info(`Task ${id} successfully deleted.`);
      this.router.navigate(['/dashboard']);
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

    const requiredPermission = newStatus ? 'mark:assigned:tasks' : 'unmark:assigned:tasks';

    if (!this.canToggleCompletion()) {
      // FIX: Added explicit permission rule to error message
      this.errorMessage.set(`You do not have permission to mark this task as ${newStatus ? 'complete' : 'incomplete'}. You must be the assigned user and have the '${requiredPermission}' permission.`);
      this.isCompleted.set(!newStatus);
      return;
    }

    this.isSaving.set(true);
    const updateDto: UpdateTaskDto = { isCompleted: newStatus };
    this.tasksService.updateTask(id, updateDto).pipe(
      finalize(() => this.isSaving.set(false)),
      catchError(err => {
        this.logger.error(`Failed to toggle task ${id} completion status`, err);
        this.errorMessage.set(`Status toggle failed: ${err.error?.message || 'Server error.'}. Check assignment and permission.`);
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
