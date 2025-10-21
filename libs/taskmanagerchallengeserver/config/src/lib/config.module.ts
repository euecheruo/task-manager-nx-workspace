import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { EnvironmentService } from './services/environment.service';
import { environmentValidationSchema } from './validations/environment.validation';
import { databaseConfig } from './database.config';
import { jwtConfig } from './jwt.config';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
      envFilePath: [
        `apps/taskmanagerchallengeserver/.env.${process.env.NODE_ENV}.local`,
        `apps/taskmanagerchallengeserver/.env.${process.env.NODE_ENV}`,
        'apps/taskmanagerchallengeserver/.env',
      ],
      validationSchema: environmentValidationSchema,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
  ],
  providers: [EnvironmentService],
  exports: [NestConfigModule, EnvironmentService],
})

export class ConfigModule { }
