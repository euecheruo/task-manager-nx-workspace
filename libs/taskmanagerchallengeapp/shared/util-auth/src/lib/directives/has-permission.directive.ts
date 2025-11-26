import {
  Directive,
  Input,
  OnInit,
  inject,
  TemplateRef,
  ViewContainerRef,
  effect,
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
  standalone: true,
})
export class HasPermissionDirective implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly injector = inject(Injector);

  @Input() appHasPermission!: string | string[];

  private userPermissions = this.authService.userPermissions;

  ngOnInit(): void {
    this.logger.debug('HasPermissionDirective initialized. Setting up effect to watch permissions.');

    effect(() => {
      this.updateView();
    }, { injector: this.injector });
  }

  /**
   * Checks if the user has all required permissions and updates the view container.
   * This function is now the callback for the Angular 'effect', ensuring reactivity.
   */
  private updateView(): void {
    const requiredPermissions = Array.isArray(this.appHasPermission)
      ? this.appHasPermission
      : [this.appHasPermission];

    const userPermissions = this.userPermissions();

    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    const requiredPermsString = requiredPermissions.join(', ');

    if (hasPermission) {
      if (this.viewContainer.length === 0) {
        this.logger.debug(`HasPermissionDirective: User AUTHORIZED for [${requiredPermsString}]. Rendering element.`);
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    } else {
      if (this.viewContainer.length > 0) {
        this.logger.debug(`HasPermissionDirective: User NOT authorized for [${requiredPermsString}]. Hiding element.`);
        this.viewContainer.clear();
      }
    }
  }
}
