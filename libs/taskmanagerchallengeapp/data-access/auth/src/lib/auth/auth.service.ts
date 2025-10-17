import { Injectable, inject } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { tap, filter, switchMap } from 'rxjs/operators';
import { AuthStore } from './auth.store';
import { UserProfile } from '@task-manager-nx-workspace/data-access/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth0 = inject(Auth0Service);
  private authStore = inject(AuthStore);

  constructor() {
    this.initializeAuthentication();
  }

  loginWithRedirect(): void {
    this.authStore.setLoading(true);
    this.auth0.loginWithRedirect({
      appState: { target: '/tasks' },
    });
  }

  signupWithRedirect(): void {
    this.authStore.setLoading(true);
    this.auth0.loginWithRedirect({
      appState: { target: '/tasks' },
      authorizationParams: {
        screen_hint: 'signup'
      }
    });
  }

  logout = this.authStore.logout;

  private initializeAuthentication(): void {
    this.auth0.isLoading$.pipe(
      tap(isLoading => this.authStore.setLoading(isLoading))
    ).subscribe();

    this.auth0.isAuthenticated$.pipe(
      filter(isAuthenticated => isAuthenticated),
      switchMap(() => this.auth0.idTokenClaims$),
      filter((claims): claims is any => !!claims),
      tap(claims => {
        const permissions: string[] = claims['permissions'] || [];

        const profile: UserProfile = {
          sub: claims.sub,
          email: claims.email,
          localUserId: null,
        };

        this.authStore.setProfile(profile, permissions);
      })
    ).subscribe({
      error: (err) => console.error('AuthService: Error during claim extraction:', err)
    });
  }
}
