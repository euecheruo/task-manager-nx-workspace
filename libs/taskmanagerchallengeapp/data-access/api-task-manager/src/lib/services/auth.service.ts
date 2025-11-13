import { Injectable, computed, signal, inject, WritableSignal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, Observable, throwError, catchError } from 'rxjs';
import { CurrentUserPayload, TokenResponse } from '../../../../../shared/util-auth/src/lib/models/user.model';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';

/**
 * Utility function to decode the base64 payload of a JWT.
 */
function decodeJwtPayload(token: string): CurrentUserPayload | null {
  try {
    if (!token) {
      return null;
    }
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded) as CurrentUserPayload;
  } catch (e) {
    console.error('Failed to decode JWT payload:', e);
    return null;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);
  private readonly API_URL = '/api/auth';

  public accessToken: WritableSignal<string | null> = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null
  );
  private refreshTokenValue: WritableSignal<string | null> = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('refreshToken') : null
  );

  public refreshInProgress = signal<boolean>(false);

  /**
   * Corrected type annotation to use Signal<T>. Decodes the access token payload for user data.
   */
  public currentUser: Signal<CurrentUserPayload | null> = computed(() => {
    const token = this.accessToken();
    if (!token) {
      return null;
    }
    const payload = decodeJwtPayload(token);
    this.logger.debug('Computed currentUser from token payload.', payload);
    return payload;
  });

  /**
   * Derived signal for authentication status.
   */
  public isAuthenticated: Signal<boolean> = computed(() => !!this.currentUser());

  /**
   * Derived signal for easy access to permissions array (used by HasPermissionDirective).
   */
  public userPermissions: Signal<string[]> = computed(() => {
    const permissionsString = this.currentUser()?.permissions;
    if (!permissionsString) {
      return [];
    }
    return permissionsString.split(',').map(p => p.trim()).filter(p => p.length > 0);
  });

  constructor() {
    this.logger.info('AuthService initialized.');
    if (this.isAuthenticated()) {
      this.logger.info(`User session found for: ${this.currentUser()?.email}`);
    }
  }

  /**
   * Stores tokens locally and updates reactive signals.
   */
  private setTokens(tokens: TokenResponse): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    this.accessToken.set(tokens.accessToken);
    this.refreshTokenValue.set(tokens.refreshToken);
    this.logger.info('Tokens successfully stored and signals updated.');
  }

  /**
   * Clears all local storage tokens and resets signals.
   */
  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.accessToken.set(null);
    this.refreshTokenValue.set(null);
    this.logger.info('All tokens cleared.');
  }

  /**
   * Handles user login API call.
   */
  login(email: string, password: string): Observable<TokenResponse> {
    const payload = { email, password };
    this.logger.log(`Attempting login for ${email}`);
    return this.http.post<TokenResponse>(`${this.API_URL}/login`, payload).pipe(
      tap((tokens) => {
        this.setTokens(tokens);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  /**
   * Handles token rotation API call.
   */
  refreshTokens(): Observable<TokenResponse> {
    const currentRefreshToken = this.refreshTokenValue();
    if (!currentRefreshToken) {
      this.logout(false);
      return throwError(() => new Error('No refresh token available. Forced logout.'));
    }

    this.refreshInProgress.set(true);
    this.logger.debug('Refresh token request initiated.');

    return this.http.post<TokenResponse>(`${this.API_URL}/refresh`, {}).pipe(
      tap((tokens) => {
        this.setTokens(tokens);
        this.refreshInProgress.set(false);
      }),
      catchError((err) => {
        this.logger.error('Token refresh failed.', err);
        this.clearTokens();
        this.refreshInProgress.set(false);
        this.router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  /**
   * Handles user logout.
   */
  logout(callApi: boolean = true): void {
    this.logger.log('Initiating logout process.');
    if (callApi && this.isAuthenticated()) {
      this.http.post<any>(`${this.API_URL}/logout`, {})
        .pipe(
          tap(() => this.logger.log('Backend logout successful (token revoked).')),
          catchError((err) => {
            this.logger.error('Backend logout failed or token was invalid. Forcing client-side termination.', err);
            return throwError(() => err);
          })
        )
        .subscribe({
          next: () => this.clearTokens(),
          error: () => this.clearTokens(),
          complete: () => {
            this.clearTokens();
            this.router.navigate(['/login']);
          },
        });
    } else {
      this.clearTokens();
      this.router.navigate(['/login']);
    }
  }

  public getRefreshToken(): string | null {
    return this.refreshTokenValue();
  }
}
