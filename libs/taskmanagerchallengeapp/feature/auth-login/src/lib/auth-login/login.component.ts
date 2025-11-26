import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  email = signal<string>('');
  password = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.logger.info('LoginComponent initialized.');
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    const userEmail = this.email();
    const userPassword = this.password();

    if (!userEmail || !userPassword) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.logger.log(`Submitting login for ${userEmail}.`);

    this.authService.login(userEmail, userPassword).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => {
        this.logger.log('Login successful.');
      },
      error: (err) => {
        this.logger.error('Login failed.', err);
        this.errorMessage.set('Login failed. Please check your credentials and try again.');
        this.password.set('');
      },
    });
  }
}
