export interface JwtPayload {
  userId: number;
  
  email: string;

  permissions: string[];
  
  exp?: number;
  
  iat?: number;
}
