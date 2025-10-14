import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable
} from 'typeorm';

import { AbstractEntity } from '@task-manager-nx-workspace/utils/lib/entities/abstract.entity';
import { RoleEntity } from './role.entity';
import { TaskEntity } from '@task-manager-nx-workspace/task/lib/entities/task.entity';
import { TaskAssignmentEntity } from '@task-manager-nx-workspace/task/lib/entities/task-assignment.entity';

@Entity('users')
export class UserEntity extends AbstractEntity {

  @PrimaryGeneratedColumn({ name: 'user_id' })
  id: number | undefined;

  @Column({ type: 'varchar', length: 128, name: 'auth0_id', unique: true, nullable: false })
  auth0Id: string;

  @Column({ type: 'varchar', length: 255, name: 'email', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'nickname', nullable: true })
  nickname: string | null;

  @OneToMany(() => TaskEntity, task => task.creator)
  createdTasks: TaskEntity[];

  @OneToMany(() => TaskAssignmentEntity, assignment => assignment.assignedUser)
  assignments: TaskAssignmentEntity[];

  @ManyToMany(() => RoleEntity, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  constructor(
    auth0Id: string,
    email: string,
    nickname: string | null = null,
    id?: number
  ) {
    super(id);

    this.id = id;
    this.auth0Id = auth0Id;
    this.email = email;
    this.nickname = nickname;

  }
}
