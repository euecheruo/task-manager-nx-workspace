// /workspace-root/libs/app/shared/ui-layout/lib/main-layout/main-layout.component.ts 

import { Component, inject, computed, Signal } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../../shared/util-logger/src/lib/services/logger.service';
import { HasPermissionDirective } from '../../../../../shared/util-auth/src/lib/directives/has-permission.directive';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  // FIX: Added missing imports list
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive, HasPermissionDirective],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
})
export class MainLayoutComponent {
  public readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);

  public isAuthenticated = this.authService.isAuthenticated;
  public currentUser = this.authService.currentUser;

  // FIX: Compute user role client-side since it's missing from the JWT payload
  public userRole: Signal<'Editor' | 'Viewer' | 'Unknown'> = computed(() => {
    const permissions = this.authService.userPermissions();
    // Editor role criteria: must have 'create:tasks'
    if (permissions.includes('create:tasks')) {
      return 'Editor';
    }
    // Viewer role criteria: must have 'read:tasks' (which is the baseline required permission)
    if (permissions.includes('read:tasks')) {
      return 'Viewer';
    }
    return 'Unknown';
  });

  onLogout(): void {
    this.logger.log('Logout button clicked in MainLayout.');
    this.authService.logout();
  }
}
