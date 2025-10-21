import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '@task-manager-nx-workspace/api/data-access/lib/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof UserEntity | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      return null;
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);

export type UserFromRequest = Omit<UserEntity, 'passwordHash' | 'refreshTokens'>;
