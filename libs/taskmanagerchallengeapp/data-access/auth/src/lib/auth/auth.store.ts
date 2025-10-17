import { Injectable, signal, computed, WritableSignal, inject } from '@angular/core';
import { AuthState, UserProfile } from '@task-manager-nx-workspace/data-access/models';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';

const initialState: AuthState = {
  profile: null,
  permissions: [],
  isLoading: true,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private auth0Service = inject(Auth0Service);

  private state: WritableSignal<AuthState> = signal(initialState);

  public isAuthenticated = computed(() => !!this.state().profile && !this.state().isLoading);

  public userProfile = computed(() => this.state().profile);

  public userPermissions = computed(() => this.state().permissions);

  public isLoading = computed(() => this.state().isLoading);

  public hasPermission = computed(() => (permission: string) =>
    this.state().permissions.includes(permission)
  );

  setProfile(profile: UserProfile, permissions: string[]): void {
    this.state.update(state => ({
      ...state,
      profile,
      permissions,
      isLoading: false,
      error: null,
    }));
  }

  setLoading(isLoading: boolean): void {
    this.state.update(state => ({ ...state, isLoading }));
  }

  logout(): void {
    this.state.set(initialState);

    this.auth0Service.logout({
      logoutParams: { returnTo: window.location.origin }
    });
  }
}
