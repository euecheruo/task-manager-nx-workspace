import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/abstract.entity';
import { UserEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/user.entity';
import { TaskEntity } from './task.entity';

@Entity('task_assignments')
export class TaskAssignmentEntity extends AbstractEntity {

  @PrimaryGeneratedColumn({ name: 'assignment_id' })
  override id: number | undefined;

  @Column({ type: 'int', name: 'task_id', nullable: false, unique: true })
  taskId: number;

  @Column({ type: 'int', name: 'assigned_user_id', nullable: true })
  assignedUserId: number | undefined;

  @Column({ type: 'timestamp with time zone', name: 'assigned_at', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  @ManyToOne(() => TaskEntity, task => task.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity | undefined;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser: UserEntity | undefined;
  constructor(
    taskId: number,
    assignedUserId: number | undefined,
    id?: number,
    assignedAt?: Date
  ) {
    super(id);

    this.id = id;
    this.taskId = taskId;
    this.assignedUserId = assignedUserId;
    this.assignedAt = assignedAt || new Date();
  }
}
