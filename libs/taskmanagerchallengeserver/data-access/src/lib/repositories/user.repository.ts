import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    const count = await this.count({
      where: { email },
    });
    return count > 0;
  }

  async findOneByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.passwordHash')
      .getOne();
  }

  async findUserWithRolesAndPermissions(userId: number): Promise<UserEntity | null> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermission')
      .leftJoinAndSelect('rolePermission.permission', 'permission')
      .where('user.userId = :userId', { userId })
      .getOne();
  }
}
