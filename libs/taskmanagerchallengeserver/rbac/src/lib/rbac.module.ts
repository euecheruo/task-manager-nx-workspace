import { Module } from '@nestjs/common';
import { PermissionsGuard } from './guards/permissions.guard';
import { CoreModule } from '@task-manager-nx-workspace/api/core';

@Module({
  imports: [CoreModule],
  providers: [
    PermissionsGuard,
  ],
  exports: [PermissionsGuard],
})
export class RbacModule { }
