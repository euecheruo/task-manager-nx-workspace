import { Component, inject, signal, OnInit, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsersService } from '../../../../../data-access/api-task-manager/src/lib/services/users.service';
import { UserProfileResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { catchError, of, finalize } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css',
})
export class UserProfileComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  public userProfile = signal<UserProfileResponse | null>(null);
  public isLoading = signal<boolean>(true);
  public errorMessage = signal<string | null>(null);

  /**
   * Computed property to derive the user role based on permissions available in the JWT payload.
   * If the user has 'create:tasks', they are an 'Editor'; otherwise, 'Viewer'.
   * This is correctly defined as a computed Signal.
   */
  public userRole: Signal<'Editor' | 'Viewer'> = computed(() => {
    const permissions = this.authService.userPermissions();
    if (permissions.includes('create:tasks')) {
      return 'Editor';
    }
    return 'Viewer';
  });

  ngOnInit(): void {
    this.logger.info('UserProfileComponent initialized. Loading profile.');

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserProfile();
  }

  /**
   * Fetches the user profile from the backend API using the /me endpoint.
   */
  loadUserProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.usersService.getMe().pipe(
      finalize(() => this.isLoading.set(false)),
      catchError((err) => {
        this.logger.error('Failed to load user profile.', err);
        let msg = 'Failed to load user profile.';
        if (err.status === 403) {
          msg = 'Forbidden: Missing read:own:accounts permission or profile not found.';
        }
        this.errorMessage.set(msg);
        return of(null);
      })
    ).subscribe((profile) => {
      if (profile) {
        this.userProfile.set(profile);
        this.logger.debug(`Loaded user profile for: ${profile.email}`);
      }
    });
  }
}
