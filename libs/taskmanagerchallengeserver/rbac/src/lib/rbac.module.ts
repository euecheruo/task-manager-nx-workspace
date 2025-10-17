import { Module } from '@nestjs/common';
import { PermissionsGuard } from './guards/permissions.guard';
import { CoreModule } from '../core/core.module'; // Assuming core module is where utilities might live

@Module({
  imports: [CoreModule],
  providers: [
    PermissionsGuard,
  ],
  exports: [PermissionsGuard],
})
export class RbacModule { }
