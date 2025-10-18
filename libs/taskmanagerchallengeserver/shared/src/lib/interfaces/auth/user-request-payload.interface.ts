export interface UserRequestPayload {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
}
