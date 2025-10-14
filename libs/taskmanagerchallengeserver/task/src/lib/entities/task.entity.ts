import {
  Entity,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn
} from 'typeorm';

import { AbstractEntity } from '@task-manager-nx-workspace/utils/lib/entities/abstract.entity';
import { UserEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/user.entity';
import { TaskAssignmentEntity } from './task-assignment.entity';

@Entity('tasks')
export class TaskEntity extends AbstractEntity {

  @PrimaryGeneratedColumn({ name: 'task_id' })
  override id: number | undefined;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_completed' })
  isCompleted: boolean;

  @Column({ type: 'int', name: 'creator_user_id', nullable: false })
  creatorUserId: number;

  @ManyToOne(() => UserEntity, user => user.createdTasks)
  @JoinColumn({ name: 'creator_user_id' })
  creator: UserEntity;

  @OneToOne(() => TaskAssignmentEntity, assignment => assignment.task, { cascade: true })
  assignment: TaskAssignmentEntity | null;

  constructor(
    title: string,
    creatorUserId: number,
    description: string | null = null,
    isCompleted: boolean,
    id?: number
  ) {
    super(id);

    this.id = id;
    this.title = title;
    this.description = description;
    this.isCompleted = isCompleted;
    this.creatorUserId = creatorUserId;

    this.creator = null as any;
    this.assignment = null;
  }
}
