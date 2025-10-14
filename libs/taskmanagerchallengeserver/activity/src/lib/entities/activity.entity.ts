import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn
} from 'typeorm';

import { AbstractEntity } from '@task-manager-nx-workspace/utils/lib/entities/abstract.entity';
import { UserEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/user.entity';
import { TaskEntity } from '@task-manager-nx-workspace/task/lib/entities/task.entity';

@Entity('activities')
export class ActivityEntity extends AbstractEntity {

  @PrimaryGeneratedColumn({ name: 'activity_id' })
  override id: number | undefined;

  @Column({ type: 'varchar', length: 100, name: 'action_type', nullable: false })
  actionType: string;

  @Column({ type: 'int', name: 'task_id', nullable: false })
  taskId: number;

  @Column({ type: 'int', name: 'user_id', nullable: true })
  userId: number | null;

  @Column({ type: 'jsonb', name: 'details', nullable: true })
  details: Record<string, any> | null;

  @ManyToOne(() => TaskEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;

  constructor(
    actionType: string,
    taskId: number,
    userId: number | null = null,
    details: Record<string, any> | null = null,
    id?: number
  ) {
    super(id);

    this.id = id;
    this.actionType = actionType;
    this.taskId = taskId;
    this.userId = userId;
    this.details = details;

    this.task = null as any;
    this.user = null;
  }
}
