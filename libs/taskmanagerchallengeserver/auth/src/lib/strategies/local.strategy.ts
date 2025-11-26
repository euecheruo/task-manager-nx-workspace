import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
interface AuthenticatedUser {
  userId: number;
  email: string;
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
    this.logger.verbose('LocalStrategy initialized.');
  }

  /**
   * The validate method verifies the user's credentials.
   * NOTE: This method is used if AuthGuard('local') is applied.
   * @param email The user's email address.
   * @param password The user's password.
   * @returns The user payload (excluding password hash) or throws UnauthorizedException.
   */
  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    this.logger.debug(`Attempting credential validation for email: ${email}`);

    try {
      const user = await this.authService.validateUserCredentials(email, password);
      if (!user) {
        this.logger.warn(`Local authentication failed for ${email}: Invalid credentials.`);
        throw new UnauthorizedException('Invalid credentials.');
      }
      return user;
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      this.logger.error(`Error during local authentication for ${email}: ${e}`);
      throw new UnauthorizedException('Authentication failed due to system error.');
    }
  }
}
