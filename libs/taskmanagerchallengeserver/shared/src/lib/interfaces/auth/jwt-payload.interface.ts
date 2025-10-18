/**
 * Defines the standard structure for the data *encoded* within the JWT Access Token.
 * This interface is crucial for ensuring the AuthService and JwtStrategy agree
 * on the token content, explicitly including RBAC fields to fix the TypeScript error.
 */
export interface JwtPayload {
  userId: number;

  email: string;

  roles: string[];

  permissions: string[];

  iat?: number;

  exp?: number;
}
