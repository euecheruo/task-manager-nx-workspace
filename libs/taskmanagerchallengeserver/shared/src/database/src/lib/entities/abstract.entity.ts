import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';

export abstract class AbstractEntity extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number | undefined;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
  constructor(id?: number) {
    super();
    this.id = id;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
