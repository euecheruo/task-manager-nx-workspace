import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner, EntityNotFoundError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/user.entity';
import { RoleEntity } from '../../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/role.entity';
import { PermissionEntity } from '../../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/permission.entity';
import { UserRoleEntity } from '../../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/user-role.entity';
import { RolePermissionEntity } from '../../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/role-permission.entity';
import { TaskEntity } from '../../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/task.entity';
import { RefreshTokenEntity } from '../../../../../libs/taskmanagerchallengeserver/data-access/src/lib/entities/refresh-token.entity';

const ROLES = {
  EDITOR: { roleId: 1, roleName: 'editor' },
  VIEWER: { roleId: 2, roleName: 'viewer' },
};

const PERMISSIONS = [
  { permissionId: 1, permissionName: 'create:tasks' },
  { permissionId: 2, permissionName: 'read:tasks' },
  { permissionId: 3, permissionName: 'assign:tasks' },
  { permissionId: 4, permissionName: 'update:own:tasks' },
  { permissionId: 5, permissionName: 'delete:own:tasks' },
  { permissionId: 6, permissionName: 'unassign:tasks' },
  { permissionId: 7, permissionName: 'mark:assigned:tasks' },
  { permissionId: 8, permissionName: 'unmark:assigned:tasks' },
  { permissionId: 9, permissionName: 'read:own:accounts' },
];

const EDITOR_PERMISSIONS = [
  1, // create:tasks
  2, // read:tasks
  3, // assign:tasks
  4, // update:own:tasks
  5, // delete:own:tasks
  6, // unassign:tasks
  7, // mark:assigned:tasks
  8, // unmark:assigned:tasks
  9, // read:own:accounts
];
const VIEWER_PERMISSIONS = [
  2, // read:tasks
  3, // assign:tasks
  6, // unassign:tasks
  7, // mark:assigned:tasks
  8, // unmark:assigned:tasks
  9, // read:own:accounts
];
const ROLE_PERMISSIONS_MAP = {
  [ROLES.EDITOR.roleId]: EDITOR_PERMISSIONS,
  [ROLES.VIEWER.roleId]: VIEWER_PERMISSIONS,
};

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private readonly BCRYPT_SALT_ROUNDS = 10;

  constructor(private dataSource: DataSource) { }

  /**
   * Drops and re-creates the schema, then inserts all initial seed data.
   */
  async seed(): Promise<void> {
    this.logger.log('Starting SEED process...');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('Executing step 1/5: Synchronizing schema (dropping and recreating tables)...');
      await this.dataSource.synchronize(true);

      this.logger.log('Executing step 2/5: Inserting Roles...');
      await this.insertRoles(queryRunner);

      this.logger.log('Executing step 3/5: Inserting Permissions...');
      await this.insertPermissions(queryRunner);

      this.logger.log('Executing step 4/5: Inserting Role-Permission links...');
      await this.insertRolePermissions(queryRunner);

      this.logger.log('Executing step 5/5: Inserting seed users and user roles...');
      await this.insertUsers(queryRunner);

      this.logger.log('Resetting database sequence IDs...');
      await this.resetSequences(queryRunner);

      await queryRunner.commitTransaction();
      this.logger.log('SEED process completed successfully.');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('SEED failed. Transaction rolled back.', error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Connects to the database and deletes all schema components (tables and data).
   */
  async unseed(): Promise<void> {
    this.logger.warn('Starting UNSEED process (wiping database schema)...');
    try {

      const entities = this.dataSource.entityMetadatas;

      for (const entity of entities) {
        const tableName = entity.tableName;
        const query = `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`;
        await this.dataSource.query(query);
      }
      await this.dataSource.dropDatabase();
      await this.dataSource.synchronize();
      this.logger.warn('UNSEED process completed (database schema wiped).');
    } catch (error) {
      this.logger.error('UNSEED failed.', error.stack);
      throw error;
    }
  }

  private async insertRoles(queryRunner: QueryRunner): Promise<void> {
    const rolesToInsert = Object.values(ROLES).map(role =>
      queryRunner.manager.create(RoleEntity, role)
    );

    if (!rolesToInsert) {
      throw new EntityNotFoundError(RoleEntity, `Roles not found: ${JSON.stringify(rolesToInsert)}`);
    }

    await queryRunner.manager.save(RoleEntity, rolesToInsert);

    this.logger.verbose(`[Completed] Inserted ${rolesToInsert.length} roles (Editor/Viewer).`);
  }

  private async insertPermissions(queryRunner: QueryRunner): Promise<void> {
    const permissionsToInsert = PERMISSIONS.map(permission =>
      queryRunner.manager.create(PermissionEntity, permission)
    );

    if (!permissionsToInsert) {
      throw new EntityNotFoundError(PermissionEntity, `Permissions not found: ${JSON.stringify(permissionsToInsert)}`);
    }

    await queryRunner.manager.save(PermissionEntity, permissionsToInsert);
    this.logger.verbose(`[Completed] Inserted ${permissionsToInsert.length} permissions.`);
  }

  private async insertRolePermissions(queryRunner: QueryRunner): Promise<void> {
    const linksToInsert: Partial<RolePermissionEntity>[] = []; // Initialized as an array
    for (const [roleId, permissionIds] of Object.entries(ROLE_PERMISSIONS_MAP)) {
      const role = await queryRunner.manager.findOne(RoleEntity, { where: { roleId: parseInt(roleId, 10) } });
      for (const permissionId of permissionIds) {
        const permission = await queryRunner.manager.findOne(PermissionEntity, { where: { permissionId: permissionId } });
        if (!role || !permission) {
          throw new Error(`Role: ${JSON.stringify(role)} or Permission: ${JSON.stringify(permission)} not found.`);
        }
        const rolePermission = new RolePermissionEntity();
        rolePermission.role = role;
        rolePermission.permission = permission;
        linksToInsert.push(rolePermission);
      }
    }

    await queryRunner.manager.save(RolePermissionEntity, linksToInsert);
    this.logger.verbose(`[Completed] Inserted ${linksToInsert.length} role-permission links (RBAC Matrix).`);
  }

  private async insertUsers(queryRunner: QueryRunner): Promise<void> {
    const passwordHash1 = await bcrypt.hash('MK2~DT?8R^=G~5oaM6Gw+8', this.BCRYPT_SALT_ROUNDS);
    const passwordHash2 = await bcrypt.hash('4V+726=mk>esc9DjH4=5r8', this.BCRYPT_SALT_ROUNDS);
    const passwordHash3 = await bcrypt.hash('6M*>pypL527g#N7J,AQf4W', this.BCRYPT_SALT_ROUNDS);
    const passwordHash4 = await bcrypt.hash('R^?De8uf4Ffc~AgQAoWqo2', this.BCRYPT_SALT_ROUNDS);

    const seedUsersData = [
      { userId: 1, email: 'user1@faketest.com', passwordHash: passwordHash1, roleId: ROLES.EDITOR.roleId },
      { userId: 2, email: 'user2@faketest.com', passwordHash: passwordHash2, roleId: ROLES.VIEWER.roleId },
      { userId: 3, email: 'user3@faketest.com', passwordHash: passwordHash3, roleId: ROLES.EDITOR.roleId },
      { userId: 4, email: 'user4@faketest.com', passwordHash: passwordHash4, roleId: ROLES.VIEWER.roleId },
    ];

    const usersToInsert = seedUsersData.map(user =>
      queryRunner.manager.create(UserEntity, {
        userId: user.userId,
        email: user.email,
        passwordHash: user.passwordHash,
      })
    );

    if (!usersToInsert) {
      throw new EntityNotFoundError(UserEntity, `Users not found: ${JSON.stringify(usersToInsert)}`);
    }

    await queryRunner.manager.save(UserEntity, usersToInsert);
    this.logger.verbose(`[Completed] Inserted ${usersToInsert.length} users.`);

    const userRolesToInsert = seedUsersData.map(user =>
      queryRunner.manager.create(UserRoleEntity, {
        userId: user.userId,
        roleId: user.roleId
      })
    );

    if (!userRolesToInsert) {
      throw new EntityNotFoundError(UserEntity, `RoleUsers not found: ${JSON.stringify(userRolesToInsert)}`);
    }

    await queryRunner.manager.save(UserRoleEntity, userRolesToInsert);
    this.logger.verbose(`[Completed] Inserted ${userRolesToInsert.length} user-role links.`);
  }

  private async resetSequences(queryRunner: QueryRunner): Promise<void> {
    const sequences = [
      { table: 'users', column: 'user_id' },
      { table: 'roles', column: 'role_id' },
      { table: 'permissions', column: 'permission_id' },
      { table: 'refresh_tokens', column: 'token_id' },
      { table: 'user_roles', column: 'user_role_id' },
      { table: 'role_permissions', column: 'role_permission_id' },
      { table: 'tasks', column: 'task_id' },
    ];

    for (const { table, column } of sequences) {
      await queryRunner.query(
        `SELECT setval(pg_get_serial_sequence('${table}', '${column}'), (SELECT COALESCE(MAX(${column}), 1) FROM ${table}) + 1);`
      );
    }
    this.logger.verbose('[Completed] Sequences reset successfully.');
  }
}
