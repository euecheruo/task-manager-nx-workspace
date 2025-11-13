// /workspace-root/libs/app/shared/util-auth/lib/interceptors/token.interceptor.ts

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
  of // <-- CORRECTED: Added 'of' for error handling in the replayed queue
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

  // 1. Determine which token to use
  let token = authService.accessToken();

  // Special case: If the request is for /api/auth/refresh, use the refresh token
  const isRefreshRequest = req.url.includes('/api/auth/refresh');
  if (isRefreshRequest) {
    // We use a dedicated method in AuthService to read the refresh token signal
    token = authService.getRefreshToken();
    logger.debug('TokenInterceptor: Using refresh token for /refresh endpoint.');
  }

  // 2. Add Authorization header if a token exists
  const authenticatedReq = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
    : req;

  // 3. Handle the request and look for 401 errors
  return next(authenticatedReq).pipe(
    catchError((error) => {
      // Only handle 401 for non-refresh requests
      if (error instanceof HttpErrorResponse && error.status === 401 && !isRefreshRequest) {
        logger.warn('TokenInterceptor: Received 401 Unauthorized. Initiating refresh sequence.');
        return handle401Error(authService, logger, req, next);
      }

      // Pass non-401 errors or the failing refresh request error through
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

  // 1. If refresh is already in progress, queue the current request and wait
  if (authService.refreshInProgress()) {
    logger.debug('TokenInterceptor: Refresh already in progress, queuing request.');
    pendingRequests.push(req);

    // Wait for the refreshSubject to emit (signaling success) and replay the request.
    return refreshSubject.pipe(
      filter(success => success), // Wait until refresh succeeds (emits true)
      take(1), // Complete after first successful emission
      switchMap(() => {
        const newToken = authService.accessToken(); // Read the signal to get the new token

        if (!newToken) {
          // Safety check
          return throwError(() => new Error('Refresh succeeded but token is missing for replay.'));
        }

        // Replay the original request with the new token
        const newAuthReq = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
        });
        logger.debug('TokenInterceptor: Replaying queued request.');
        return next(newAuthReq);
      })
    );
  }

  // 2. If refresh is NOT in progress, start it
  authService.refreshInProgress.set(true);
  pendingRequests.push(req); // Queue the request that triggered the refresh

  return authService.refreshTokens().pipe(
    switchMap(() => {
      // Refresh succeeded
      const newToken = authService.accessToken();
      if (!newToken) {
        return throwError(() => new Error('Refresh succeeded but access token is null.'));
      }

      // Notify queued requests that the token is ready (emits true)
      refreshSubject.next(true);

      // 3. Replay ALL pending requests (including the one that triggered the refresh)
      const requestsToReplay = [...pendingRequests];
      pendingRequests = []; // Clear the queue after copying

      // Use Observable.concat or merge to combine the results, but here we just
      // process the queue in a loop, ensuring each request completes its own stream.
      const replayedObservables: Observable<HttpEvent<unknown>>[] = requestsToReplay.map(queuedReq => {
        const replayedReq = queuedReq.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
        });

        // Run the request and catch any errors, ensuring the outer stream doesn't break
        return next(replayedReq).pipe(
          catchError(err => {
            logger.error('Error replaying queued request:', err);
            // Return 'of(null)' to prevent the error from propagating up
            return of(null as unknown as HttpEvent<any>);
          })
        );
      });

      // Combine the results of all replayed requests and return the merged stream
      // Since the caller only cares about their *original* request, we must
      // ensure we return the result for the specific request that initiated the refresh.
      // However, since we cleared the queue and re-ran everything, the caller's request
      // is already part of `replayedObservables`. We need to return the one that
      // corresponds to the original `req`'s stream.

      // Simpler approach: find the Observable for the original request and return it.
      // Since all requests are replayed, we just return a successful dummy Observable 
      // here and rely on the individual queued requests to complete.
      // NOTE: This complex logic usually means we must carefully manage which request 
      // belongs to the caller. A Subject-based solution is cleaner.

      // Let's stick to the cleanest pattern: just return the result of the original caller's request.
      // Find the stream for the original request (req) from the replayed set.
      const originalRequestReplay = replayedObservables.find((_, index) => requestsToReplay[index] === req);

      if (originalRequestReplay) {
        return originalRequestReplay;
      }

      // Fallback: If for some reason the original request is not found, throw an error
      return throwError(() => new Error('Failed to find and return the stream for the original request after refresh.'));
    }),
    catchError((err) => {
      // Refresh failed (AuthService should already clear tokens and navigate to /login)
      logger.error('TokenInterceptor: Token refresh failed. Aborting queued requests.');
      refreshSubject.next(false); // Signal failure to queued requests
      pendingRequests = []; // Clear the queue
      return throwError(() => err);
    }),
    finalize(() => {
      // Reset the refresh flag when the refresh attempt stream completes or errors
      authService.refreshInProgress.set(false);
    })
  );
}
