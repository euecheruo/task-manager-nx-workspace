// /workspace-root/apps/app/src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// The application uses standalone components and a functional config
bootstrapApplication(App, appConfig).catch((err) =>
  console.error(err)
);
