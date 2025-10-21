import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRequestPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/user-request-payload.interface';

export const User = createParamDecorator(
  (data: keyof UserRequestPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserRequestPayload;

    if (!user) {
      return null;
    }

    if (data) {
      return user[data];
    }

    return user;
  },
);
