import { UserRequestPayload } from './user-request-payload.interface';
export interface UserRequest extends Request {
  user: UserRequestPayload;
}
