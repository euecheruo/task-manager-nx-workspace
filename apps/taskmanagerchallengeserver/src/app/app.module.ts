// /workspace-root/apps/api/src/app/app.module.ts

import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../../../../libs/taskmanagerchallengeserver/users/src/lib/users.module';
import { TasksModule } from '../../../../libs/taskmanagerchallengeserver/tasks/src/lib/tasks.module';
import { AuthModule } from '../../../../libs/taskmanagerchallengeserver/auth/src/lib/auth.module';
import { DataAccessModule } from '../../../../libs/taskmanagerchallengeserver/data-access/src/lib/data-access.module'; // Global entities repository [cite: 113]
import { SharedModule } from '../../../../libs/taskmanagerchallengeserver/shared/src/lib/shared.module';
import { SeederModule } from '../seeder/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env.production'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    // 2. Configure TypeORM/PostgreSQL asynchronously
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule to make ConfigService available [cite: 113]
      inject: [ConfigService], // Inject ConfigService to be passed to useFactory [cite: 113]
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        // Auto-load entities globally via DataAccessModule
        autoLoadEntities: true,
        synchronize: true, // WARNING: Set to false in production! [cite: 114, 115]
      }),
    }),
    UsersModule,
    TasksModule,
    SharedModule,
    AuthModule,
    // 3. Global modules
    DataAccessModule, // Exports entity repositories globally [cite: 113]
    SeederModule, // CRITICAL FIX: Ensures SeederService provider is available in the context [cite: 99]
  ],
  controllers: [], // Controller definition [cite: 113]
  providers: [Logger], // Added Logger for standard NestJS practice, though optional [cite: 113]
})

export class AppModule { }
