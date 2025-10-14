// libs/api/shared/src/database/entities/role.entity.ts

import {
  Entity,
  Column,
  ManyToMany,
  PrimaryGeneratedColumn
} from 'typeorm';

import { AbstractEntity } from '@task-manager-nx-workspace/utils/lib/entities/abstract.entity';
import { UserEntity } from './user.entity';

@Entity('roles')
/**
 * @description
 * TypeORM entity mapping to the PostgreSQL 'roles' table.
 * Defines the roles available in the system (Editor, Viewer) and their associated permissions.
 */
@Entity('roles')
export class RoleEntity extends AbstractEntity {

  @PrimaryGeneratedColumn({ name: 'role_id' })
  id: number | undefined;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: false })
  name: string;

  @Column('jsonb', { nullable: false, default: '[]' })
  permissions: string[];

  @ManyToMany(() => UserEntity, user => user.roles)
  users: UserEntity[];

  constructor(
    name: string,
    permissions: string[] = [],
    id?: number
  ) {
    super(id);

    this.id = id;
    this.name = name;
    this.permissions = permissions;
  }
}
