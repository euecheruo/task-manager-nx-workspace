// libs/api/activity/activity.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityEntity } from '../entities/activity.entity';
import { CreateActivityDto } from '../dto/create-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: Repository<ActivityEntity>,
  ) { }

  async create(dto: CreateActivityDto): Promise<ActivityEntity> {
    const newActivity = this.activityRepository.create(dto);
    return this.activityRepository.save(newActivity);
  }

  async getHistoryByTaskId(taskId: number): Promise<ActivityEntity[]> {
    return this.activityRepository.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
    });
  }
}
