// UsersService in /workspace-root/libs/app/data-access/api-task-manager/lib/services/users.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { UserProfileResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);
  private readonly API_URL = '/api/users';

  /**
   * Fetches the current authenticated user's profile details.
   */
  getMe(): Observable<UserProfileResponse> {
    this.logger.log('Fetching current user profile (GET /api/users/me).');
    return this.http.get<UserProfileResponse>(`${this.API_URL}/me`);
  }

  /**
   * Fetches a list of all users (for task assignment select boxes).
   */
  getAllUsers(): Observable<UserProfileResponse[]> {
    this.logger.log('Fetching all users for assignment (GET /api/users).');
    return this.http.get<UserProfileResponse[]>(this.API_URL);
  }

  /**
   * Placeholder for updating user details (e.g., email).
   */
  updateUser(email: string): Observable<UserProfileResponse> {
    this.logger.log('Updating user email (PATCH /api/users/me).');
    return this.http.patch<UserProfileResponse>(`${this.API_URL}/me`, { email });
  }
}
