import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany } from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { RoleEntity } from './role.entity';
import { TaskEntity } from '@task-manager-nx-workspace/task/lib/entities/task.entity';
import { TaskAssignmentEntity } from '@task-manager-nx-workspace/task/lib/entities/task-assignment.entity';

@Entity('users')
export class UserEntity extends AbstractEntity {

  @PrimaryGeneratedColumn({ name: 'user_id' })
  override id: number | undefined;

  @Column({ type: 'varchar', length: 128, name: 'auth0_id', unique: true, nullable: false })
  auth0Id: string;

  @Column({ type: 'varchar', length: 255, name: 'email', unique: true, nullable: false })
  email: string;

  @OneToMany(() => TaskEntity, task => task.creator)
  createdTasks: TaskEntity[];

  @OneToMany(() => TaskAssignmentEntity, assignment => assignment.assignedUser)
  assignments: TaskAssignmentEntity[];

  @ManyToMany(() => RoleEntity, role => role.users)
  roles: RoleEntity[];

  constructor(auth0Id: string, email: string, id?: number) {
    super(id);
    this.id = id;
    this.auth0Id = auth0Id;
    this.email = email;
    this.createdTasks = [];
    this.assignments = [];
    this.roles = [];
  }
}
