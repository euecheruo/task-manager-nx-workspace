import { Entity, Column, ManyToOne, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AbstractEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/abstract.entity';
import { UserEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/user.entity';
import { TaskAssignmentEntity } from './task-assignment.entity';

@Entity('tasks')
export class TaskEntity extends AbstractEntity {

  @PrimaryGeneratedColumn({ name: 'task_id' })
  override id: number | undefined;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string | undefined;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'int', name: 'creator_id', nullable: false })
  creatorId: number | undefined;

  @ManyToOne(() => UserEntity, user => user.createdTasks, {
    onDelete: 'RESTRICT', // Matches SQL schema constraint
  })
  @JoinColumn({ name: 'creator_id' })
  creator: UserEntity | undefined;

  @OneToMany(() => TaskAssignmentEntity, assignment => assignment.task)
  assignments: TaskAssignmentEntity[];

  constructor(
    title?: string,
    creatorId?: number,
    description?: string | null,
    isCompleted?: boolean,
    id?: number,
    assignments?: TaskAssignmentEntity[]
  ) {
    super(id);

    this.id = id;
    this.title = title;
    this.description = description || null;
    this.creatorId = creatorId;
    this.isCompleted = isCompleted ?? false;
    this.completedAt = null;
    this.assignments = assignments || [];
  }
}
