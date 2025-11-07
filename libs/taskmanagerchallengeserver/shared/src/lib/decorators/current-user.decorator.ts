import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  userId: number;
  email: string;
  permissions: string;
  refreshToken?: string;
  [key: string]: any;
}

/**
 * Custom parameter decorator to retrieve the authenticated user payload (req.user) 
 * or a specific property (e.g., the user ID).
 * Usage: @CurrentUser() user: CurrentUserPayload
 * Usage: @CurrentUser('userId') userId: number
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext): CurrentUserPayload | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
