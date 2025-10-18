import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvVars } from './validations/environment.validation';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const env: EnvVars = process.env as any;

  return {
    type: 'postgres',
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    entities: [__dirname + '/../../../data-access/src/lib/entities/*.entity.{js,ts}'],
    synchronize: env.NODE_ENV === 'development',
    logging: env.NODE_ENV === 'development' ? ['error', 'warn', 'schema'] : false,
  };
});
