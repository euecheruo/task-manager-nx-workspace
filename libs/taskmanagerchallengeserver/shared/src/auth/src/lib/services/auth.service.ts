import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) { }

  getAuth0UserId(userPayload: any): string {
    return userPayload.sub;
  }

  async findLocalUserByAuth0Id(auth0Id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { auth0Id } });
  }

  getPermissionsFromPayload(userPayload: any): string[] {
    return userPayload.permissions || [];
  }
}
