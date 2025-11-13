import { inject } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  Observable,
  throwError,
  catchError,
  switchMap,
  finalize,
  Subject,
  filter,
  take,
  of
} from 'rxjs';
import { AuthService } from '../../../../../data-access/api-task-manager/src/lib/services/auth.service';
import { LoggerService } from '../../../../util-logger/src/lib/services/logger.service';

/**
 * Storage for requests that failed due to 401 and need to be replayed
 * after a successful token refresh.
 */
let pendingRequests: HttpRequest<unknown>[] = [];

/**
 * Subject used to signal when the token refresh is successfully completed (emits true) 
 * or failed (emits false). This wakes up all queued requests.
 */
const refreshSubject = new Subject<boolean>();

/**
 * Functional Interceptor to attach JWT and handle token refresh logic.
 */
export const TokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const logger = inject(LoggerService);

  let token = authService.accessToken();

  const isRefreshRequest = req.url.includes('/api/auth/refresh');
  if (isRefreshRequest) {
    token = authService.getRefreshToken();
    logger.debug('TokenInterceptor: Using refresh token for /refresh endpoint.');
  }

  const authenticatedReq = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
    : req;

  return next(authenticatedReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isRefreshRequest) {
        logger.warn('TokenInterceptor: Received 401 Unauthorized. Initiating refresh sequence.');
        return handle401Error(authService, logger, req, next);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Handles the 401 error by initiating a token refresh and replaying failed requests.
 */
function handle401Error(
  authService: AuthService,
  logger: LoggerService,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {

  if (authService.refreshInProgress()) {
    logger.debug('TokenInterceptor: Refresh already in progress, queuing request.');
    pendingRequests.push(req);

    return refreshSubject.pipe(
      filter(success => success),
      take(1),
      switchMap(() => {
        const newToken = authService.accessToken();

        if (!newToken) {
          return throwError(() => new Error('Refresh succeeded but token is missing for replay.'));
        }

        const newAuthReq = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
        });
        logger.debug('TokenInterceptor: Replaying queued request.');
        return next(newAuthReq);
      })
    );
  }

  authService.refreshInProgress.set(true);
  pendingRequests.push(req);

  return authService.refreshTokens().pipe(
    switchMap(() => {
      const newToken = authService.accessToken();
      if (!newToken) {
        return throwError(() => new Error('Refresh succeeded but access token is null.'));
      }

      refreshSubject.next(true);

      const requestsToReplay = [...pendingRequests];
      pendingRequests = [];

      const replayedObservables: Observable<HttpEvent<unknown>>[] = requestsToReplay.map(queuedReq => {
        const replayedReq = queuedReq.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
        });

        return next(replayedReq).pipe(
          catchError(err => {
            logger.error('Error replaying queued request:', err);
            return of(null as unknown as HttpEvent<any>);
          })
        );
      });

      const originalRequestReplay = replayedObservables.find((_, index) => requestsToReplay[index] === req);

      if (originalRequestReplay) {
        return originalRequestReplay;
      }

      return throwError(() => new Error('Failed to find and return the stream for the original request after refresh.'));
    }),
    catchError((err) => {
      logger.error('TokenInterceptor: Token refresh failed. Aborting queued requests.');
      refreshSubject.next(false);
      pendingRequests = [];
      return throwError(() => err);
    }),
    finalize(() => {
      authService.refreshInProgress.set(false);
    })
  );
}
