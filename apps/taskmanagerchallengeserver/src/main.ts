import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { EnvironmentService } from '@task-manager-nx-workspace/api/config/lib/services/environment.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const envService = app.get(EnvironmentService);
  const port = envService.getAppPort();
  const isDev = envService.isDevelopment();

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: isDev ? '*' : envService.get<string>('FRONTEND_URL'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: ${await app.getUrl()}/api`,
    'Bootstrap',
  );
  if (isDev) {
    Logger.warn('⚠️ Running in DEVELOPMENT mode with TypeORM synchronize=true.', 'Bootstrap');
  }
}

bootstrap();
