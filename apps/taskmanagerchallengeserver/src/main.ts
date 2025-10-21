import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const envService = app.get(EnvironmentService);
  const port = envService.getAppPort();
  const isDev = envService.isDevelopment();

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: isDev ? '*' : false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('Local Auth, RBAC, and Task Management System.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: ${await app.getUrl()}/api`,
    'Bootstrap',
  );
  if (isDev) {
    Logger.warn(
      '⚠️ Running in DEVELOPMENT mode with TypeORM synchronize=true.',
      'Bootstrap',
    );
  }
}

bootstrap();
