import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { UserEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/user.entity';
import { RefreshTokenEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/refresh-token.entity';
import { RolesModule } from '@task-manager-nx-workspace/api/roles/lib/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    RolesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule { }
