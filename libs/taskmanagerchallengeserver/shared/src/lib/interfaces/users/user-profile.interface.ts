export interface UserProfile {
  userId: string;
  email: string;
  roles: { roleName: string }[];
  permissions: string[];
}
