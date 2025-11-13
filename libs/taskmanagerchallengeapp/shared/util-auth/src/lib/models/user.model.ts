// /workspace-root/libs/app/shared/util-auth/lib/models/user.model.ts

// JWT payload structure from the backend
export interface CurrentUserPayload {
  userId: number;
  email: string;
  // Comma-separated string of permissions: 'create:tasks,read:tasks,update:own:tasks,...'
  permissions: string;
  role: 'editor' | 'viewer';
  iat: number;
  exp: number;
}

// Response structure for login and token refresh
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Response structure for fetching a user's profile (e.g., /api/users/me or creator/assigned user details)
export interface UserProfileResponse {
  userId: number;
  email: string;
  createdAt: string;
}
