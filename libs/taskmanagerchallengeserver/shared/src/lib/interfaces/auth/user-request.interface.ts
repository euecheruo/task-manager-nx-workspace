import { Request } from 'express';
import { JwtPayload } from '../dto/auth/jwt-payload.interface';

export interface UserRequest extends Request {
  user: JwtPayload;
}
