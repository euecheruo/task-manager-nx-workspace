// /workspace-root/libs/app/shared/util-auth/lib/models/user.model.ts

export interface CurrentUserPayload {
  userId: number;
  email: string;
  permissions: string;
  // FIX: Removed 'role' property as it is not present in the NestJS JWT payload
  iat: number;
  exp: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfileResponse {
  userId: number;
  email: string;
  createdAt: string;
}
