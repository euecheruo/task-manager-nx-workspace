import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn({ name: 'task_id' })
  task_id: number;
  @Column({ length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;
  @Column({ name: 'creator_id', nullable: false })
  creator_id: number;

  @Column({ name: 'assigned_user_id', nullable: true })
  assigned_user_id: number | null;
  @Column({ name: 'is_completed', default: false, nullable: false })
  is_completed: boolean;
  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completed_at: Date | null;
  @ManyToOne(() => UserEntity, (user) => user.createdTasks, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity;
  @ManyToOne(() => UserEntity, (user) => user.assignedTasks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser: UserEntity | null;
}
