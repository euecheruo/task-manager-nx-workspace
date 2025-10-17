export interface JwtPayload {
  userId: number;
  
  email: string;

  permissions: string[];

  iss?: string;
  
  sub?: string;
  
  exp?: number;
  
  iat?: number;
}
