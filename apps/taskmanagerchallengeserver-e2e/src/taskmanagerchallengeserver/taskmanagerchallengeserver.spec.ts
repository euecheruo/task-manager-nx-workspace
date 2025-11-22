import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// FIXED: Changed from "import * as request" to "import request"
import request from 'supertest';
import { AppModule } from '../../../../apps/taskmanagerchallengeserver/src/app/app.module';
import { SeederService } from '../../../../apps/taskmanagerchallengeserver/src/seeder/services/seeder.service';

describe('Task Manager API (E2E)', () => {
  let app: INestApplication;
  let seeder: SeederService;

  // Store tokens for reuse across tests
  let editorToken: string;
  let viewerToken: string;

  // Known seed data
  const EDITOR_EMAIL = 'user1@faketest.com';
  const EDITOR_PASS = 'MK2~DT?8R^=G~5oaM6Gw+8';
  const VIEWER_EMAIL = 'user2@faketest.com';
  const VIEWER_PASS = '4V+726=mk>esc9DjH4=5r8';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Ensure pipes (validation) match main.ts
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    // Reset and Seed Database
    seeder = app.get(SeederService);
    // Ensure clean state before testing
    await seeder.unseed(); 
    await seeder.seed();   
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('/auth/login (POST) - Editor Login', async () => {
      const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: EDITOR_EMAIL, password: EDITOR_PASS })
      .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      editorToken = response.body.accessToken;
    });

    it('/auth/login (POST) - Viewer Login', async () => {
      const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: VIEWER_EMAIL, password: VIEWER_PASS })
      .expect(201);

      viewerToken = response.body.accessToken;
    });

    it('/auth/login (POST) - Invalid Credentials', () => {
      return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: EDITOR_EMAIL, password: 'WRONG_PASSWORD' })
      .expect(401);
    });
  });

  describe('Task Operations (RBAC & ABAC)', () => {
    let createdTaskId: number;

    it('/tasks (POST) - Editor can Create Task', async () => {
      const dto = { title: 'E2E Test Task', description: 'Testing creation' };
      const response = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${editorToken}`)
      .send(dto)
      .expect(201);

      expect(response.body.title).toEqual(dto.title);
      expect(response.body.creatorId).toBeDefined();
      createdTaskId = response.body.taskId;
    });

    it('/tasks (POST) - Viewer CANNOT Create Task (RBAC)', async () => {
      await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Viewer Task' })
      .expect(403); // Forbidden
    });

    it('/tasks/:id (GET) - Viewer can Read Task', async () => {
      await request(app.getHttpServer())
      .get(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(200);
    });

    it('/tasks/:id (PATCH) - Viewer CANNOT Update Task (RBAC)', async () => {
      await request(app.getHttpServer())
      .patch(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Hacked Title' })
      .expect(403);
    });

    it('/tasks/:id (PATCH) - Editor can Update OWN Task (ABAC)', async () => {
      const response = await request(app.getHttpServer())
      .patch(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ title: 'Updated Title' })
      .expect(200);

      expect(response.body.title).toEqual('Updated Title');
    });

    it('/tasks/:id (DELETE) - Editor can Delete OWN Task', async () => {
      await request(app.getHttpServer())
      .delete(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
      .get(`/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(404);
    });
  });

  describe('Users', () => {
    it('/users/me (GET) - Get Profile', async () => {
      const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${editorToken}`)
      .expect(200);

      expect(response.body.email).toEqual(EDITOR_EMAIL);
    });
  });
});
