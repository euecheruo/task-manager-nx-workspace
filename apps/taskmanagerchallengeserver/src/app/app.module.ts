import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../../../../libs/taskmanagerchallengeserver/users/src/lib/users.module';
import { TasksModule } from '../../../../libs/taskmanagerchallengeserver/tasks/src/lib/tasks.module';
import { AuthModule } from '../../../../libs/taskmanagerchallengeserver/auth/src/lib/auth.module';
import { DataAccessModule } from '../../../../libs/taskmanagerchallengeserver/data-access/src/lib/data-access.module';
import { SharedModule } from '../../../../libs/taskmanagerchallengeserver/shared/src/lib/shared.module';
import { SeederModule } from '../seeder/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env.production'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        autoLoadEntities: true,
        synchronize: config.get<string>('IS_SYNCHRONIZED') === 'true',
      }),
    }),
    UsersModule,
    TasksModule,
    SharedModule,
    AuthModule,
    DataAccessModule,
    SeederModule,
  ],
  controllers: [],
  providers: [Logger],
})

export class AppModule { }
