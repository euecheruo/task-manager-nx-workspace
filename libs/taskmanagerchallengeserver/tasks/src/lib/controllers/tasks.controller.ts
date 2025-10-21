import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from '../services/tasks.service';
import { Permissions } from '@task-manager-nx-workspace/api/rbac/lib/decorators/permissions.decorator';
import { User } from '@task-manager-nx-workspace/api/auth/lib/decorators/user.decorator';
import { UserRequestPayload } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/user-request-payload.interface';
import { TaskCreateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-create.dto';
import { TaskUpdateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-update.dto';
import { TaskAssignDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-assign.dto';
import { TaskResponseDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-response.dto';
import { TaskStatusDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-status.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Get()
  @ApiOperation({ summary: 'Retrieve all tasks.' })
  @ApiResponse({ status: 200, type: [TaskResponseDto] })
  @Permissions('read:tasks')
  findAll(): Promise<TaskResponseDto[]> {
    return this.tasksService.findAllTasks();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task (Requires Editor role).' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  @HttpCode(HttpStatus.CREATED)
  @Permissions('create:tasks')
  create(
    @Body() createTaskDto: TaskCreateDto,
    @User() user: UserRequestPayload,
  ): Promise<TaskResponseDto> {
    return this.tasksService.createTask(createTaskDto, user.userId);
  }

  @Put(':taskId')
  @ApiOperation({ summary: 'Update an existing task (Only creator/Editor role allowed).' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @Permissions('update:own:tasks')
  update(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() updateTaskDto: TaskUpdateDto,
    @User() user: UserRequestPayload,
  ): Promise<TaskResponseDto> {
    return this.tasksService.updateOwnTask(taskId, user.userId, updateTaskDto);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Delete a task (Only creator/Editor role allowed).' })
  @ApiResponse({ status: 204, description: 'Task successfully deleted.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('delete:own:tasks')
  remove(
    @Param('taskId', ParseIntPipe) taskId: number,
    @User() user: UserRequestPayload,
  ): Promise<void> {
    return this.tasksService.deleteOwnTask(taskId, user.userId);
  }

  @Patch(':taskId/assign')
  @ApiOperation({ summary: 'Assign an **unassigned** task to a user.' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @Permissions('assign:tasks')
  assign(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() assignTaskDto: TaskAssignDto,
  ): Promise<TaskResponseDto> {
    return this.tasksService.assignTask(taskId, assignTaskDto.assignedUserId);
  }

  @Patch(':taskId/unassign')
  @ApiOperation({ summary: 'Unassign any assigned task from any user.' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @Permissions('unassign:tasks')
  unassign(
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<TaskResponseDto> {
    return this.tasksService.unassignTask(taskId);
  }

  @Patch(':taskId/complete')
  @ApiOperation({ summary: 'Mark an assigned task as completed (Only for the assigned user).' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @Permissions('mark:assigned:tasks')
  markComplete(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() statusDto: TaskStatusDto,
    @User() user: UserRequestPayload,
  ): Promise<TaskResponseDto> {
    return this.tasksService.markTaskCompleted(taskId, user.userId, statusDto);
  }

  @Patch(':taskId/incomplete')
  @ApiOperation({ summary: 'Unmark a completed task as incomplete (Only for the assigned user).' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @Permissions('unmark:assigned:tasks')
  markIncomplete(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() statusDto: TaskStatusDto,
    @User() user: UserRequestPayload,
  ): Promise<TaskResponseDto> {
    return this.tasksService.markTaskIncomplete(taskId, user.userId, statusDto);
  }
}
