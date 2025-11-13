// /workspace-root/apps/app/src/app/app.routes.ts

import { Route } from '@angular/router';
import { AuthGuard } from '../../../../libs/taskmanagerchallengeapp/shared/util-auth/src/lib/guards/auth.guard'; // Aliased path
import { LoginComponent } from '../../../../libs/taskmanagerchallengeapp/feature/auth-login/src/lib/auth-login/login.component';
import { MainLayoutComponent } from '../../../../libs/taskmanagerchallengeapp/shared/ui-layout/src/lib/ui-layout/main-layout.component'; // Use main layout for authenticated routes
import { DashboardComponent } from '../../../../libs/taskmanagerchallengeapp/feature/tasks-dashboard/src/lib/tasks-dashboard/dashboard.component';
import { AddTaskComponent } from '../../../../libs/taskmanagerchallengeapp/feature/tasks-add/src/lib/tasks-add/add-task.component';
import { UpdateTaskComponent } from '../../../../libs/taskmanagerchallengeapp/feature/tasks-update/src/lib/tasks-update/update-task.component';
import { ViewTaskComponent } from '../../../../libs/taskmanagerchallengeapp/feature/tasks-view/src/lib/tasks-view/view-task.component';
import { UserProfileComponent } from '../../../../libs/taskmanagerchallengeapp/feature/user-profile/src/lib/user-profile/user-profile.component';

export const appRoutes: Route[] = [
  // 1. PUBLIC ROUTES (No Layout, No AuthGuard)
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login',
  },

  // 2. AUTHENTICATED ROUTES (Using MainLayoutComponent as the shell)
  {
    path: '',
    component: MainLayoutComponent, // This component provides the header/sidebar for all internal pages
    canActivate: [AuthGuard],      // All children must be authenticated
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        title: 'Task Dashboard',
        // STATIC LOAD
        component: DashboardComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'tasks/add',
        title: 'Add Task',
        // STATIC LOAD
        component: AddTaskComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'tasks/update/:id',
        title: 'Update Task',
        // STATIC LOAD
        component: UpdateTaskComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'tasks/view/:id',
        title: 'View Task',
        // STATIC LOAD
        component: ViewTaskComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'profile',
        title: 'User Profile',
        // STATIC LOAD
        component: UserProfileComponent,
        canActivate: [AuthGuard],
      },
    ],
  },

  // 3. FALLBACK ROUTE
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
