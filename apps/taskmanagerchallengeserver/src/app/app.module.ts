import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@task-manager-nx-workspace/shared/database/lib/database.module';
import { AuthModule } from '@task-manager-nx-workspace/shared/auth/lib/auth.module';
import { TaskModule } from '@task-manager-nx-workspace/task/lib/task.module';
import { ActivityModule } from '@task-manager-nx-workspace/activity/lib/activity.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
    DatabaseModule,
    AuthModule,
    TaskModule,
    ActivityModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
