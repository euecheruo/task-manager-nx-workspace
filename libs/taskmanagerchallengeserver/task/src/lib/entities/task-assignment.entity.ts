import {
  Entity,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn
} from 'typeorm';

import { AbstractEntity } from '@task-manager-nx-workspace/utils/lib/entities/abstract.entity';
import { UserEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/user.entity';
import { TaskEntity } from './task.entity';

@Entity('task_assignments')
export class TaskAssignmentEntity extends AbstractEntity {

  @PrimaryGeneratedColumn({ name: 'assignment_id' })
  override id: number | undefined;

  @Column({ type: 'int', name: 'task_id', unique: true, nullable: false })
  taskId: number;

  @Column({ type: 'int', name: 'assigned_user_id', nullable: false })
  assignedUserId: number;

  @OneToOne(() => TaskEntity, task => task.assignment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity;

  @ManyToOne(() => UserEntity, user => user.assignments)
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser: UserEntity;

  constructor(
    taskId: number,
    assignedUserId: number,
    id?: number
  ) {
    super(id);

    this.id = id;
    this.taskId = taskId;
    this.assignedUserId = assignedUserId;
    this.task = null as any;
    this.assignedUser = null as any;
  }
}
