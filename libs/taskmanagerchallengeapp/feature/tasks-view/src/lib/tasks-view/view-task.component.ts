// /workspace-root/libs/app/feature/tasks-view/lib/view-task.component.ts

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TasksService } from '../../../../../data-access/api-task-manager/src/lib/services/tasks.service';
import { Task } from '../../../../../data-access/api-task-manager/src/lib/models/task.model';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { finalize, catchError, of } from 'rxjs'; // Import RxJS operators

@Component({
  selector: 'app-view-task',
  standalone: true,
  imports: [
    CommonModule, // Required for *ngIf, *ngFor, pipes like date, and the Elvis operator (?)
    RouterLink,   // Required for the [routerLink] directive on the "Back to Dashboard" button
  ],
  templateUrl: './view-task.component.html',
  styleUrl: './view-task.component.css',
})
export class ViewTaskComponent implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly route = inject(ActivatedRoute);
  private readonly logger = inject(LoggerService);

  public task = signal<Task | null>(null);
  public isLoading = signal<boolean>(true);
  public errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Retrieve Task ID from the route parameters
    const taskId = Number(this.route.snapshot.paramMap.get('id'));
    if (taskId) {
      this.loadTaskDetails(taskId);
    } else {
      this.errorMessage.set('Invalid task ID provided.');
      this.isLoading.set(false);
    }
  }

  /**
   * Fetches the specific task details by ID from the API.
   * @param id The ID of the task to load.
   */
  loadTaskDetails(id: number): void {
    this.tasksService.getTask(id).pipe( // <-- Corrected service call from findOne to getTask
      finalize(() => this.isLoading.set(false)),
      catchError((err) => {
        this.logger.error(`Failed to load task ${id}.`, err);
        let msg = 'Failed to load task details.';
        if (err.status === 404) {
          msg = 'Task not found.';
        } else if (err.status === 403) {
          msg = 'Forbidden: Missing read:tasks permission.';
        }
        this.errorMessage.set(msg);
        return of(null);
      })
    ).subscribe((task) => {
      if (task) {
        this.task.set(task);
      }
    });
  }

  /**
   * Helper function for date formatting.
   */
  formatDate(dateString: string | Date | null): string {
    if (!dateString) return 'N/A';
    // Using simple toLocaleDateString() for presentation
    return new Date(dateString).toLocaleDateString();
  }
}
