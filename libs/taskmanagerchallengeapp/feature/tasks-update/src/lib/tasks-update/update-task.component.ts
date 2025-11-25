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
import { switchMap, finalize, catchError, of } from 'rxjs';

@Component({
  selector: 'app-update-task',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HasPermissionDirective
  ],
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

  public taskDetails: WritableSignal<Task | null> = signal(null);
  public users: WritableSignal<UserProfileResponse[]> = signal([]); // Changed to array for safety
  public loading: WritableSignal<boolean> = signal(true);
  public isSaving: WritableSignal<boolean> = signal(false);
  public errorMessage: WritableSignal<string | null> = signal(null);

  public taskId: WritableSignal<number | null> = signal(null);
  public title: WritableSignal<string> = signal('');
  public description: WritableSignal<string> = signal('');
  public isCompleted: WritableSignal<boolean> = signal(false);
  public assignedUserId: WritableSignal<number | null> = signal(null);

  private currentUserId = computed(() => this.authService.currentUser()?.userId);
  public userPermissions = this.authService.userPermissions;

  public isTaskCreator: Signal<boolean> = computed(() => {
    return this.taskDetails()?.creatorId === this.currentUserId();
  });

  public canEditCoreDetails: Signal<boolean> = computed(() => {
    const isCreator = this.isTaskCreator();
    const hasPermission = this.userPermissions().includes('update:own:tasks');
    return hasPermission && isCreator;
  });

  public canToggleCompletion: Signal<boolean> = computed(() => {
    const task = this.taskDetails();
    if (!task) return false;
    const isAssigned = task.assignedUserId === this.currentUserId();
    if (!isAssigned) return false;
    const requiredPermission = this.isCompleted() ? 'unmark:assigned:tasks' : 'mark:assigned:tasks';
    return this.userPermissions().includes(requiredPermission);
  });

  ngOnInit(): void {
    this.fetchUsers();
    this.fetchTask();
  }

  private fetchUsers(): void {
    this.usersService.getAllUsers().pipe(
      catchError(err => {
        this.logger.error('Error fetching users list.', err);
        return of([]);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(users => {
      this.users.set(Array.isArray(users) ? users : []);
    });
  }

  private fetchTask(): void {
    this.route.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = Number(params.get('id'));
        if (isNaN(id)) {
          this.errorMessage.set('Invalid task ID provided.');
          this.loading.set(false);
          return of(null);
        }
        this.taskId.set(id);
        this.logger.log(`Fetching task details for ID: ${id}`);
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
    ).subscribe(task => {
      if (task) {
        this.taskDetails.set(task);
        this.initializeForm(task);
      } else if (this.taskId() !== null && !this.errorMessage()) {
        this.errorMessage.set('Task details could not be loaded.');
      }
      this.loading.set(false);
    });
  }

  private initializeForm(task: Task): void {
    this.title.set(task.title);
    this.description.set(task.description || '');
    this.isCompleted.set(task.isCompleted);
    this.assignedUserId.set(task.assignedUserId);
  }

  public onSubmit(): void {
    if (!this.canEditCoreDetails()) {
      this.errorMessage.set('You do not have permission to modify this task.');
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

        if (err.status === 409) {
          this.errorMessage.set('Task update failed: A task with this title already exists.');
        } else {
          this.errorMessage.set(`Core update failed: ${err.error?.message || 'Server error.'}. Check if you are the creator and have the 'update:own:tasks' permission.`);
        }
        return of(null);
      })
    ).subscribe(updatedTask => {
      if (updatedTask) {
        this.logger.info(`Task ${id} successfully updated.`);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  public onDelete(): void {
    const requiredPermission = 'delete:own:tasks';
    if (!this.isTaskCreator() || !this.userPermissions().includes(requiredPermission)) {
      this.errorMessage.set(`Permission denied.`);
      return;
    }
    const id = this.taskId();
    if (id === null) return;
    if (!window.confirm(`Are you sure?`)) return;

    this.isSaving.set(true);
    this.tasksService.deleteTask(id).pipe(
      finalize(() => this.isSaving.set(false)),
      catchError(err => {
        this.logger.error(`Failed to delete task ${id}`, err);
        this.errorMessage.set(`Deletion failed: ${err.error?.message}.`);
        return of(null);
      })
    ).subscribe(() => {
      this.logger.info(`Task ${id} successfully deleted.`);
      this.router.navigate(['/dashboard']);
    });
  }

  public onCompletionToggle(newStatus: boolean): void {
    const id = this.taskId();
    if (id === null) return;

    const requiredPermission = newStatus ? 'mark:assigned:tasks' : 'unmark:assigned:tasks';
    if (!this.canToggleCompletion()) {
      this.errorMessage.set(`Permission denied.`);
      this.isCompleted.set(!newStatus);
      return;
    }

    this.isSaving.set(true);
    const updateDto: UpdateTaskDto = { isCompleted: newStatus };

    this.tasksService.updateTask(id, updateDto).pipe(
      finalize(() => this.isSaving.set(false)),
      catchError(err => {
        this.logger.error(`Failed to toggle task ${id}`, err);
        this.errorMessage.set(`Status toggle failed: ${err.message}`);
        this.isCompleted.set(!newStatus);
        return of(null);
      })
    ).subscribe(updatedTask => {
      if (updatedTask) {
        this.isCompleted.set(updatedTask.isCompleted);
      }
    });
  }

  public onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
