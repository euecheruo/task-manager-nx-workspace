import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  ForbiddenException
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
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

@ApiTags('tasks')
@Controller('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Get()
  @Roles('read:tasks')
  @ApiOperation({ summary: 'Retrieve all tasks, including creator and assignment details.' })
  @ApiQuery({ name: 'isCompleted', required: false, type: Boolean })
  async findAll(@Query('isCompleted') isCompleted?: string): Promise<TaskDto[]> {
    let completionStatus: boolean | undefined = undefined;
    if (isCompleted !== undefined) {
      completionStatus = isCompleted === 'true';
    }

    const tasks = await this.taskService.findAll(completionStatus);
    return tasks.map(task => new TaskDto(task));
  }

  @Post()
  @Roles('create:tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task.' })
  @ApiBody({ type: CreateTaskDto })
  async create(@Body() dto: CreateTaskDto, @Req() req: AuthenticatedRequest): Promise<TaskDto> {
    const localUserId = req.user.localUserId;
    if (!localUserId) {
      throw new ForbiddenException('Local user profile not linked.');
    }

    const newTask = await this.taskService.create(dto, localUserId);
    return new TaskDto(newTask);
  }

  @Put(':id')
  @Roles('update:own:tasks') 
  @ApiOperation({ summary: 'Update an existing task (only allowed if the user is the creator).' })
  @ApiBody({ type: UpdateTaskDto })
  async update(
    @Param('id', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskDto,
    @Req() req: AuthenticatedRequest
  ): Promise<TaskDto> {
    const updatedTask = await this.taskService.updateOwn(taskId, dto, req.user.localUserId);
    return new TaskDto(updatedTask);
  }

  @Delete(':id')
  @Roles('delete:own:tasks') 
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task (only allowed if the user is the creator).' })
  async delete(
    @Param('id', ParseIntPipe) taskId: number,
    @Req() req: AuthenticatedRequest
  ): Promise<void> {
    await this.taskService.deleteOwn(taskId, req.user.localUserId);
  }

  @Post(':id/assign')
  @Roles('assign:tasks')
  @ApiOperation({ summary: 'Assign an unassigned task to a user.' })
  @ApiBody({ type: AssignTaskDto })
  async assign(
    @Param('id', ParseIntPipe) taskId: number,
    @Body() dto: AssignTaskDto,
    @Req() req: AuthenticatedRequest
  ): Promise<any> {
    await this.taskService.assignTask(taskId, dto, req.user.localUserId);
    return { message: 'Task assigned successfully.' };
  }

  @Post(':id/unassign')
  @Roles('unassign:tasks')
  @ApiOperation({ summary: 'Unassign any assigned task from a user.' })
  async unassign(
    @Param('id', ParseIntPipe) taskId: number,
    @Req() req: AuthenticatedRequest
  ): Promise<any> {
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
