import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
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

  async findUserByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async createUser(data: { email: string; passwordHash: string }): Promise<UserEntity> {
    const newUser = this.create(data);
    return this.save(newUser);
  }
}
