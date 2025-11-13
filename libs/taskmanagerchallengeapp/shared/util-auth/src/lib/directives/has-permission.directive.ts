// HasPermissionDirective in /workspace-root/libs/app/shared/util-auth/lib/directives/has-permission.directive.ts

import {
  Directive,
  Input,
  OnInit,
  inject,
  TemplateRef,
  ViewContainerRef,
  effect, // <-- Import 'effect'
  Injector
} from '@angular/core';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../util-logger/src/lib/services/logger.service';

/**
 * A structural directive that controls whether an element is rendered
 * based on the current user's permissions, reacting to signal changes using 'effect'.
 * * It acts as a structural directive (like *ngIf), manipulating the DOM by showing or hiding
 * the attached element based on the user's current authorization status.
 *
 * Usage: 
 * - Single permission: <button *appHasPermission="'create:tasks'">New Task</button>
 * - Multiple permissions (requires ALL of them): <div *appHasPermission="['update:own:tasks', 'delete:own:tasks']">...</div>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true, // This is a standalone directive
})
export class HasPermissionDirective implements OnInit {
  // Dependency injection
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly injector = inject(Injector); // Injector is required for creating an effect outside the constructor

  // Input for the required permission(s) - string or array of strings
  @Input() appHasPermission!: string | string[];

  // Computed signal for the user's current permissions (derived from the JWT payload)
  private userPermissions = this.authService.userPermissions;

  ngOnInit(): void {
    this.logger.debug('HasPermissionDirective initialized. Setting up effect to watch permissions.');

    // Set up the effect to run whenever userPermissions signal changes
    effect(() => {
      this.updateView();
    }, { injector: this.injector });
  }

  /**
   * Checks if the user has all required permissions and updates the view container.
   * This function is now the callback for the Angular 'effect', ensuring reactivity.
   */
  private updateView(): void {
    // 1. Determine the required permissions
    const requiredPermissions = Array.isArray(this.appHasPermission)
      ? this.appHasPermission
      : [this.appHasPermission];

    // 2. Get the current user's permissions from the signal (reading the signal triggers the effect dependency)
    const userPermissions = this.userPermissions();

    // 3. Check for authorization (User must possess ALL required permissions)
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    const requiredPermsString = requiredPermissions.join(', ');

    if (hasPermission) {
      // If authorized: insert the element into the DOM if it hasn't been rendered yet
      if (this.viewContainer.length === 0) {
        this.logger.debug(`HasPermissionDirective: User AUTHORIZED for [${requiredPermsString}]. Rendering element.`);
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      // If NOT authorized: clear the view container (remove the element from the DOM)
      if (this.viewContainer.length > 0) {
        this.logger.debug(`HasPermissionDirective: User NOT authorized for [${requiredPermsString}]. Hiding element.`);
        this.viewContainer.clear();
      }
    }
  }
}
