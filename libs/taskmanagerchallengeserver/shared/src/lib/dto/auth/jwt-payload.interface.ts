export interface JwtPayload {
  userId: number;

  email: string;

  roles: string[];

  permissions: string[];

  iat?: number;

  exp?: number;
}

export interface UserRequestPayload {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface UserRequest extends Request {
  user: UserRequestPayload;
}
