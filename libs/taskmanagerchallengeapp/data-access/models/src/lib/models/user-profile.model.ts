export interface UserProfile {
  sub: string;
  email: string;
  localUserId: number | null;
}

export interface AuthState {
  profile: UserProfile | null;
  permissions: string[];
  isLoading: boolean;
  error: any | null;
}
