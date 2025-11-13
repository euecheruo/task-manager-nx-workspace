// appConfig in /workspace-root/apps/app/src/app/app.config.ts

import {
  ApplicationConfig,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// FIX: Corrected path alias for TokenInterceptor
import { TokenInterceptor } from '../../../../libs/taskmanagerchallengeapp/shared/util-auth/src/lib/interceptors/token.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Zone and Change Detection setup
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 2. Routing setup using defined application routes
    provideRouter(appRoutes),

    // 3. HTTP Client setup, injecting the JWT Interceptor
    provideHttpClient(
      withInterceptors([TokenInterceptor])
    ),

    // 4. Enables Animation support (using the asynchronous provider)
    provideAnimationsAsync(),
  ],
};
