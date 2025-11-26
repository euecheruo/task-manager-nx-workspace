import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import request from 'supertest';
import * as dotenv from 'dotenv';
import { AppModule } from '../../../../apps/taskmanagerchallengeserver/src/app/app.module';
import { SeederService } from '../../../../apps/taskmanagerchallengeserver/src/seeder/services/seeder.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TaskResponse {
  taskId: number;
  title: string;
  description?: string;
  creatorId: number;
  assignedUserId?: number | null;
  isCompleted: boolean;
}

interface UserProfileResponse {
  userId: number;
  email: string;
}

describe('Task Manager API (End-to-End)', () => {
  let app: INestApplication;
  let seeder: SeederService;
  let configService: ConfigService;
  const logger = new Logger('E2E-Test');

  let editorToken: string;
  let viewerToken: string;

  const EDITOR_EMAIL = 'user1@faketest.com';
  const EDITOR_PASS = 'MK2~DT?8R^=G~5oaM6Gw+8';
  const VIEWER_EMAIL = 'user2@faketest.com';
  const VIEWER_PASS = '4V+726=mk>esc9DjH4=5r8';

  beforeAll(async () => {
    const envPath = path.resolve(__dirname, '../../../taskmanagerchallengeserver/.env.development');
    logger.log(`envPath: ${envPath}`);
    dotenv.config({ path: envPath });

    process.env.NODE_ENV = 'test';

    logger.log('Initializing E2E Test Suite...');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = app.get(ConfigService);

    const jwtSecret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!jwtSecret) {
      throw new Error('CRITICAL: JWT_ACCESS_SECRET is undefined. Check.env.development loading.');
    }

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    seeder = app.get(SeederService);
    logger.log('Resetting Database State...');
    await seeder.unseed();
    logger.log('Seeding Initial Data...');
    await seeder.seed();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Authentication Module', () => {
    it('POST /auth/login - Should authenticate Editor and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EDITOR_EMAIL, password: EDITOR_PASS })
        .expect(201);

      const body = response.body as AuthResponse;
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      editorToken = body.accessToken;
    });

    it('POST /auth/login - Should authenticate Viewer and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: VIEWER_EMAIL, password: VIEWER_PASS })
        .expect(201);

      const body = response.body as AuthResponse;
      viewerToken = body.accessToken;
    });

    it('POST /auth/login - Should reject invalid password with 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EDITOR_EMAIL, password: 'WRONG_PASSWORD_123' })
        .expect(401);
    });
  });

  describe('2. User Profile', () => {
    it('GET /users/me - Should retrieve profile using token signed with Env Secret', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(200);

      const body = response.body as UserProfileResponse;
      expect(body.email).toEqual(EDITOR_EMAIL);
    });
  });

  describe('3. Task Operations (RBAC & ABAC)', () => {
    let createdTaskId: number;

    // RBAC: Editor can create
    it('POST /tasks - Editor should create a task', async () => {
      const newTask = {
        title: 'E2E Critical Path Analysis',
        description: 'Verify system integrity.'
      };

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${editorToken}`)
        .send(newTask)
        .expect(201);

      const body = response.body as TaskResponse;
      expect(body.title).toEqual(newTask.title);
      createdTaskId = body.taskId;
    });

    it('POST /tasks - Viewer should receive 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Unauthorized Task' })
        .expect(403);
    });

    it('PATCH /tasks/:id - Editor should update their own task', async () => {
      const updateData = { title: 'Updated Title' };
      await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send(updateData)
        .expect(200);
    });

    it('PATCH /tasks/:id - Viewer should receive 403 updating others task', async () => {
      await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Malicious Edit' })
        .expect(403);
    });

    it('DELETE /tasks/:id - Editor should delete their own task', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(200);
    });
  });
});
