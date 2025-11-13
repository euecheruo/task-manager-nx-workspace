import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger('NestApplication'),
  });
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  const appPort = configService.get<number>('APP_PORT', 3333);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task Management API')
    .setDescription('JWT Secure and RBAC Authorized API Backend Service.')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    }, 'accessToken')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(appPort, () => {
    logger.log(`Server running in ${nodeEnv} mode.`, 'Bootstrap');
    logger.log(`Listening at http://localhost:${appPort}/${globalPrefix}`, 'Bootstrap');
    logger.log(`Swagger documentation available at http://localhost:${appPort}/swagger`, 'Bootstrap');
  });
}

bootstrap();
