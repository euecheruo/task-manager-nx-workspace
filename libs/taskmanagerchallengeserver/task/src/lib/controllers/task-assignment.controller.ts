import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { TaskService } from '../services/task.service';
import { AssignTaskDto } from '../dto/assign-task.dto';
import { TaskDto } from '../dto/task.dto';
import { JwtAuthGuard } from '@task-manager-nx-workspace/shared/auth/lib/guards/auth.guard';
import { PermissionsGuard } from '@task-manager-nx-workspace/shared/auth/lib/guards/permissions.guard';
import { Roles } from '@task-manager-nx-workspace/shared/auth/lib/decorators/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    permissions: string[];
    localUserId: number;
  };
}

@ApiTags('tasks-assignment')
@Controller('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaskAssignmentController {
  constructor(private readonly taskService: TaskService) { }

  @Post(':id/assign')
  @Roles('assign:tasks')
  @ApiOperation({ summary: 'Assign an unassigned task to a user.' })
  @ApiBody({ type: AssignTaskDto })
  async assign(
    @Param('id', ParseIntPipe) taskId: number,
    @Body() dto: AssignTaskDto,
    @Req() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    await this.taskService.assignTask(taskId, dto, req.user.localUserId);
    return { message: 'Task assigned successfully.' };
  }

  @Post(':id/unassign')
  @Roles('unassign:tasks')
  @ApiOperation({ summary: 'Unassign any assigned task from a user.' })
  async unassign(
    @Param('id', ParseIntPipe) taskId: number,
    @Req() req: AuthenticatedRequest
  ): Promise<{ message: string }> {
    await this.taskService.unassignTask(taskId, req.user.localUserId);
    return { message: 'Task unassigned successfully.' };
  }

  @Post(':id/complete')
  @Roles('mark:assigned:tasks')
  @ApiOperation({ summary: 'Mark a task assigned to the current user as completed.' })
  async markComplete(
    @Param('id', ParseIntPipe) taskId: number,
    @Req() req: AuthenticatedRequest
  ): Promise<TaskDto> {
    const updatedTask = await this.taskService.toggleComplete(taskId, true, req.user.localUserId);
    return new TaskDto(updatedTask);
  }

  @Post(':id/incomplete')
  @Roles('unmark:assigned:tasks')
  @ApiOperation({ summary: 'Mark a task assigned to the current user as incomplete.' })
  async unmarkComplete(
    @Param('id', ParseIntPipe) taskId: number,
    @Req() req: AuthenticatedRequest
  ): Promise<TaskDto> {
    const updatedTask = await this.taskService.toggleComplete(taskId, false, req.user.localUserId);
    return new TaskDto(updatedTask);
  }
}
