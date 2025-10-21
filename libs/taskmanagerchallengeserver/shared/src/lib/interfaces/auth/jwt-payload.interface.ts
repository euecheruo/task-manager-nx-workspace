export interface JwtPayload {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
}
