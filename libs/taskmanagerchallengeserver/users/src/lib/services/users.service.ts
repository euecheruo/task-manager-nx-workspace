import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
interface UserDetails {
  userId: number;
  email: string;
  passwordHash: string;
}
interface UserProfile {
  userId: number;
  email: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private usersRepository: UsersRepository,
  ) { }

  /**
   * Retrieves a user by their ID, returning a simplified profile object.
   * Used primarily by Guards and AuthService for token validation.
   */
  async getById(userId: number): Promise<UserProfile |
    null> {
    this.logger.verbose(`Fetching user profile by ID: ${userId}`);

    const user = await this.usersRepository.findOneById(userId);
    if (!user) {
      this.logger.warn(
        `User with ID ${userId} not found during lookup. Possible stale token or user deleted.`,
      );
      return null;
    }

    const profile: UserProfile = {
      userId: user.userId,
      email: user.email,
      createdAt: user.createdAt,
    };
    return profile;
  }

  /**
   * Retrieves a user by their email, including the password hash for login verification.
   * Used exclusively by the AuthService.login.
   */
  async getByEmail(email: string): Promise<UserDetails |
    null> {
    this.logger.verbose(`Attempting to retrieve user details by email: ${email}`);
    const user = await this.usersRepository.findOneByEmail(email);
    if (!user) {
      this.logger.warn(`User with email ${email} not found. Login failure likely.`);
      return null;
    }

    const details: UserDetails = {
      userId: user.userId,
      email: user.email,
      passwordHash: user.passwordHash,
    };
    return details;
  }

  /**
   * Fetches the aggregated list of permissions (claims) for a given user ID.
   * The result is derived via joins (user_roles -> roles -> role_permissions)
   * and returned as a comma-separated string for JWT serialization.
   */
  async getPermissionsForUser(userId: number): Promise<string> {
    this.logger.verbose(`Calculating and fetching permissions for user ID: ${userId}`);
    const permissionsString = await this.usersRepository.getUserRolesAndPermissions(userId);
    this.logger.debug(`Permissions for user ${userId}: ${permissionsString}`);

    return permissionsString;
  }

  /**
   * Public method exposed to the UsersController to retrieve the full profile for "me".
   */
  async getProfile(userId: number): Promise<UserProfile> {
    this.logger.log(`Retrieving public profile for user ID: ${userId}`);
    const profile = await this.getById(userId);
    if (!profile) {
      this.logger.error(`Attempted to fetch profile for non-existent user ID ${userId}`);
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    return profile;
  }

  /**
   * Retrieves a list of all user profiles (excluding sensitive data like password hash).
   */
  async getAllUsers(): Promise<UserProfile[]> {
    this.logger.log('Retrieving all public user profiles.');
    const users = await this.usersRepository.findAllProfiles();

    const profiles: UserProfile[] = users.map(user => ({
      userId: user.userId,
      email: user.email,
      createdAt: user.createdAt,
    }));

    this.logger.verbose(`Retrieved ${profiles.length} user profiles.`);
    return profiles;
  }
}
