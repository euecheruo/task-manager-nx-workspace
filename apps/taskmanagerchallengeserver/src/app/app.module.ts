import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CoreModule } from '@task-manager-nx-workspace/core';
import { AuthModule } from '@task-manager-nx-workspace/api/auth';
import { UsersModule } from '@task-manager-nx-workspace/api/users';
import { RolesModule } from '@task-manager-nx-workspace/api/roles';
import { TasksModule } from '@task-manager-nx-workspace/api/tasks';
import { JwtAuthGuard } from '@task-manager-nx-workspace/api/auth/lib/guards/jwt-auth.guard';
import { PermissionsGuard } from '@task-manager-nx-workspace/api/rbac/lib/guards/permissions.guard';

@Module({
  imports: [
    // 1. Foundation
    CoreModule,
    RolesModule,
    AuthModule,
    UsersModule,
    TasksModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule { }
