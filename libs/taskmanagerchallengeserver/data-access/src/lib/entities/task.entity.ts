import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn({ name: 'task_id' })
  taskId: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'creator_id', nullable: false })
  creatorId: number;

  @Column({ name: 'assigned_user_id', nullable: true })
  assignedUserId: number | null;

  @ManyToOne(() => UserEntity, (user) => user.createdTasks, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.assignedTasks, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser: UserEntity | null;
}
