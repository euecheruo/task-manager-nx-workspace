import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityEntity } from './entities/activity.entity';
import { ActivityService } from './services/activity.service';
import { ActivityController } from './controllers/activity.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityEntity]), 
  ],
  controllers: [
    ActivityController 
  ],
  providers: [
    ActivityService
  ],
  exports: [
    ActivityService
  ],
})
export class ActivityModule {}
