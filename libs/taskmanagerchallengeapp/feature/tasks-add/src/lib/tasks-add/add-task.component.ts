import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TasksService } from '../../../../../data-access/api-task-manager/src/lib/services/tasks.service';
import { UsersService } from '../../../../../data-access/api-task-manager/src/lib/services/users.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { UserProfileResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';
import { CreateTaskDto } from '../../../../../data-access/api-task-manager/src/lib/models/task.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-add-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-task.component.html',
  styleUrls: ['./add-task.component.css'],
})
export class AddTaskComponent implements OnInit {
  private readonly taskService = inject(TasksService);
  private readonly userService = inject(UsersService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  // Form state
  public title = signal<string>('');
  public description = signal<string>('');
  public assignedUserId = signal<number | null>(null);

  public users: WritableSignal<UserProfileResponse[]> = signal([]);
  public loading: WritableSignal<boolean> = signal(false);
  public isSaving: WritableSignal<boolean> = signal(false);
  public errorMessage: WritableSignal<string | null> = signal(null);

  ngOnInit(): void {
    this.logger.info('AddTaskComponent initialized.');
    this.fetchUsers();
  }

  /**
   * Fetches the list of users for the assignment dropdown.
   */
  fetchUsers(): void {
    this.loading.set(true);
    this.userService.getAllUsers().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (users) => {
        this.users.set(users);
        this.logger.debug(`Loaded ${users.length} users for assignment.`);
      },
      error: (err) => {
        this.logger.error('Failed to fetch user list.', err);
        this.errorMessage.set('Could not load user list for assignment.');
      },
    });
  }

  onSubmit(): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.logger.log('Attempting to create new task.');

    const dto: CreateTaskDto = {
      title: this.title(),
      description: this.description(),
      assignedUserId: this.assignedUserId()
    };

    this.taskService.createTask(dto).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (task) => {
        this.logger.log(`Task created successfully with ID: ${task.taskId}.`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.logger.error('Task creation failed.', err);
        this.errorMessage.set('Task creation failed. Check title/description and ensure you have permission (create:tasks).');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
