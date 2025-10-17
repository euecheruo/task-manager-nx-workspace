export type Permission =
  | 'create:tasks'
  | 'read:tasks'
  | 'assign:tasks'
  | 'update:own:tasks'
  | 'delete:own:tasks'
  | 'unassign:tasks'
  | 'mark:assigned:tasks'
  | 'unmark:assigned:tasks'
  | 'create:accounts'
  | 'update:own:accounts'
  | 'read:own:accounts';
