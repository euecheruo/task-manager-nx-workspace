import { Entity, Column, ManyToMany, PrimaryGeneratedColumn, JoinTable } from 'typeorm';
import { AbstractEntity } from './abstract.entity';
import { UserEntity } from './user.entity';

@Entity('roles')
export class RoleEntity extends AbstractEntity {

  @PrimaryGeneratedColumn({ name: 'role_id' })
  override id: number | undefined;

  @Column({ type: 'varchar', length: 50, name: 'name', unique: true, nullable: false })
  name: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description: string | null;

  @Column({ type: 'text', array: true, default: '{}', name: 'permissions' })
  permissions: string[];

  @ManyToMany(() => UserEntity, user => user.roles)
  @JoinTable({
    name: 'user_roles',
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  users: UserEntity[];

  constructor(name: string, permissions: string[] = [], description: string | null = null, id?: number) {
    super(id);

    this.id = id;
    this.name = name;
    this.description = description;
    this.permissions = permissions;
    this.users = [];
  }
}

export const EDITOR_PERMISSIONS: string[] = [
  'create:tasks',
  'read:tasks',
  'assign:tasks',
  'update:own:tasks',
  'delete:own:tasks',
  'unassign:tasks',
  'mark:assigned:tasks',
  'unmark:assigned:tasks',
];

export const VIEWER_PERMISSIONS: string[] = [
  'read:tasks',
  'assign:tasks',
  'unassign:tasks',
  'mark:assigned:tasks',
  'unmark:assigned:tasks',
];

export const InitialRoles: Partial<RoleEntity>[] = [
  {
    name: 'editor',
    description: 'User with full task creation and ownership modification rights.',
    permissions: EDITOR_PERMISSIONS,
  },
  {
    name: 'viewer',
    description: 'User with read-access and collaboration rights (assignment/completion).',
    permissions: VIEWER_PERMISSIONS,
  },
];
