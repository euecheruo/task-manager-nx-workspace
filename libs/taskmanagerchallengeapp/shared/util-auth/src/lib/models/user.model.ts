export interface CurrentUserPayload {
  userId: number;
  email: string;
  permissions: string;
  role: 'editor' | 'viewer';
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
