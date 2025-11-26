import { Module, Global } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './guards/permission.guard';

@Global()
@Module({
  providers: [
    Reflector,
    PermissionGuard,
  ],
  exports: [
    PermissionGuard,
  ],
})

export class SharedModule { }
