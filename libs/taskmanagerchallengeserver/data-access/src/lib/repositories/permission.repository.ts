import { In } from 'typeorm';
import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { PermissionEntity } from '../entities/permission.entity';

@Injectable()
export class PermissionRepository extends Repository<PermissionEntity> {
  constructor(private dataSource: DataSource) {
    super(PermissionEntity, dataSource.createEntityManager());
  }

  async findOneByName(name: string): Promise<PermissionEntity | null> {
    return this.findOne({
      where: { permissionName: name }
    });
  }

  async findByNames(names: string[]): Promise<PermissionEntity[]> {
    return this.find({
      where: {
        permissionName: In(names),
      },
    });
  }
}
