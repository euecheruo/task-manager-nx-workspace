import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@task-manager-nx-workspace/shared/auth/lib/guards/auth.guard';
import { PermissionsGuard } from '@task-manager-nx-workspace/shared/auth/lib/guards/permissions.guard';
import { Roles } from '@task-manager-nx-workspace/shared/auth/lib/decorators/roles.decorator';

import { ActivityService } from '../services/activity.service';
import { ActivityDto } from '../dto/activity.dto';

@ApiTags('activities')
@Controller('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) { }

  @Get('task/:taskId')
  @Roles('read:tasks') // Editor and Viewer roles have this permission
  async getTaskHistory(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<ActivityDto[]> {
    const activities = await this.activityService.getHistoryByTaskId(taskId);
    return activities.map(activity => new ActivityDto(activity));
  }
}
