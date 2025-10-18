import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config'; // Renamed import to avoid conflict
import { EnvironmentService } from './services/environment.service';
import { environmentSchema } from './validations/environment.validation';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import * as path from 'path';


@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: [
        process.env.NODE_ENV === 'production'
          ? path.resolve(__dirname, '../../../../../apps/taskmanagerchallengeserver/.env.production')
          : path.resolve(__dirname, '../../../../../apps/taskmanagerchallengeserver/.env.development'),
      ],
      load: [databaseConfig, jwtConfig],
      validationSchema: environmentSchema,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
      isGlobal: true,
    }),
  ],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class ConfigModule { }
