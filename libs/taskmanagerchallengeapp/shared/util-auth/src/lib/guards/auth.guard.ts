import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../util-logger/src/lib/services/logger.service';

/**
 * Functional guard to check if the user is authenticated.
 * If not, it redirects the user to the login page.
 */
export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  const isAuthenticated = authService.isAuthenticated();

  if (isAuthenticated) {
    logger.debug('AuthGuard passed: User is authenticated.');
    return true;
  }

  logger.warn('AuthGuard failed: User is not authenticated. Redirecting to login.');
  return router.createUrlTree(['/login']);
};
