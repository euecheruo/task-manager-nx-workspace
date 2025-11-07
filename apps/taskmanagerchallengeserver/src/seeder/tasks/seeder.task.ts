import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app/app.module';
import { SeederService } from '../services/seeder.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeederTask');
  const context = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  
  const seederService = context.get(SeederService);

  const migrateArg = process.argv.find(arg => arg.startsWith('--migrate='));
  const action = migrateArg ? migrateArg.split('=')[1] : null;

  if (action === 'seed') {
    logger.log('Executing database SEED...');
    await seederService.seed();
  } else if (action === 'unseed') {
    logger.log('Executing database UNSEED...');
    await seederService.unseed();
  } else {
    logger.error('Invalid migration action specified. Use --migrate=seed or --migrate=unseed.');
    process.exit(1);
  }

  await context.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  new Logger('SeederTask').error('Seeder task failed unexpectedly.', error);
  process.exit(1);
});
