import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../../data-access/src/lib/entities/user.entity';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) { }

  /**
   * Finds a user by their ID, suitable for profile lookups.
   */
  async findOneById(userId: number): Promise<UserEntity | null> {
    this.logger.debug(`DB lookup: find user by ID ${userId}`);
    const user = await this.usersRepository.findOne({
      where: { userId },
    });
    return user;
  }

  /**
   * Finds a user by their email, crucially including the password hash for authentication.
   */
  async findOneByEmail(email: string): Promise<UserEntity | null> {
    this.logger.debug(`DB lookup: find user by email ${email}`);
    const user = await this.usersRepository.findOne({
      where: { email }, // Corrected: removed 'as any'
      select: ['userId', 'email', 'passwordHash', 'createdAt'],
    });
    return user;
  }

  /**
   * Performs the complex join logic to aggregate all permissions associated with a user's roles.
   * This query requires joining through UserRoles, Roles, and RolePermissions.
   * Returns a comma-separated string of permissions.
   */
  async getUserRolesAndPermissions(userId: number): Promise<string> {
    this.logger.debug(`DB complex lookup: aggregating permissions for user ${userId}`);

    const queryResult: { permissionName: string }[] = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.userRoles', 'userRole')
      .leftJoin('userRole.role', 'role')
      .leftJoin('role.rolePermissions', 'rolePermission')
      .leftJoin('rolePermission.permission', 'permission')
      .select('permission.permissionName', 'permissionName')
      .where('user.userId = :userId', { userId })
      .distinct(true)
      .getRawMany();

    if (!queryResult || queryResult.length === 0) {
      this.logger.warn(`User ${userId} found, but has no assigned permissions.`);
      return '';
    }

    const permissions = queryResult.map(row => row.permissionName).filter(name => !!name);

    return permissions.join(',');
  }
}
