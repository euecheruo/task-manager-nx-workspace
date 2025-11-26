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
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login',
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard], // AuthGuard protects all child routes
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
      },
      {
        path: 'tasks/add',
        title: 'Add Task',
        // STATIC LOAD
        component: AddTaskComponent,
      },
      {
        path: 'tasks/update/:id',
        title: 'Update Task',
        // STATIC LOAD
        component: UpdateTaskComponent,
      },
      {
        path: 'tasks/view/:id',
        title: 'View Task',
        // STATIC LOAD
        component: ViewTaskComponent,
      },
      {
        path: 'profile',
        title: 'User Profile',
        component: UserProfileComponent,
      },
    ],
  },
  {
    // Wildcard route redirects to dashboard (which is then protected by AuthGuard)
    path: '**',
    redirectTo: 'dashboard',
  },
];
