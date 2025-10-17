import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from '../services/tasks.service';
import { TaskCreateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-create.dto';
import { TaskUpdateDto } from '@task-manager-nx-workspace/api/shared/lib/dto/tasks/task-update.dto';
import { TaskData } from '@task-manager-nx-workspace/api/shared/lib/interfaces/tasks/task-data.interface';
import { PermissionsGuard } from '@task-manager-nx-workspace/api/rbac/lib/guards/permissions.guard';
import { Permissions } from '@task-manager-nx-workspace/api/rbac/lib/decorators/permissions.decorator';
import { UserRequest } from '@task-manager-nx-workspace/api/shared/lib/interfaces/auth/user-request.interface';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  @Permissions('create:tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new task (Editor only)' })
  @ApiResponse({ status: 201, description: 'Task successfully created.' })
  async create(@Body() createTaskDto: TaskCreateDto, @Req() req: UserRequest): Promise<TaskData> {
    const userId = req.user.userId;
    return this.tasksService.create(createTaskDto, userId);
  }

  @Get()
  @Permissions('read:tasks')
  @ApiOperation({ summary: 'Retrieve all tasks (Editor/Viewer)' })
  @ApiResponse({ status: 200, description: 'List of all tasks.' })
  findAll(): Promise<TaskData[]> {
    return this.tasksService.findAll();
  }

  @Patch(':id/assign/:userId')
  @Permissions('assign:tasks')
  @ApiOperation({ summary: 'Assign an unassigned task to a user (Editor/Viewer)' })
  @ApiResponse({ status: 200, description: 'Task successfully assigned.' })
  @ApiResponse({ status: 404, description: 'Task or User not found.' })
  async assignTask(
    @Param('id', ParseIntPipe) taskId: number,
    @Param('userId', ParseIntPipe) assignedUserId: number
  ): Promise<TaskData> {
    return this.tasksService.assignTask(taskId, assignedUserId);
  }

  @Patch(':id/unassign')
  @Permissions('unassign:tasks')
  @ApiOperation({ summary: 'Unassign an assigned task (Editor/Viewer)' })
  @ApiResponse({ status: 200, description: 'Task successfully unassigned.' })
  @ApiResponse({ status: 404, description: 'Task not found.' })
  async unassignTask(@Param('id', ParseIntPipe) taskId: number): Promise<TaskData> {
    return this.tasksService.unassignTask(taskId);
  }

  @Patch(':id/complete')
  @Permissions('mark:assigned:tasks')
  @ApiOperation({ summary: 'Mark an assigned task as completed (Editor/Viewer, self-assigned)' })
  @ApiResponse({ status: 200, description: 'Task marked completed.' })
  async markComplete(@Param('id', ParseIntPipe) taskId: number, @Req() req: UserRequest): Promise<TaskData> {
    const userId = req.user.userId;
    return this.tasksService.markAsCompleted(taskId, userId);
  }

  @Patch(':id/incomplete')
  @Permissions('unmark:assigned:tasks')
  @ApiOperation({ summary: 'Mark a completed task as incomplete (Editor/Viewer, self-assigned)' })
  @ApiResponse({ status: 200, description: 'Task marked incomplete.' })
  async markIncomplete(@Param('id', ParseIntPipe) taskId: number, @Req() req: UserRequest): Promise<TaskData> {
    const userId = req.user.userId;
    return this.tasksService.markAsIncomplete(taskId, userId);
  }

  @Patch(':id')
  @Permissions('update:own:tasks')
  @ApiOperation({ summary: 'Update own task (Editor only, creator-check in service)' })
  @ApiResponse({ status: 200, description: 'Task successfully updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Not the task creator.' })
  async update(
    @Param('id', ParseIntPipe) taskId: number,
    @Body() updateTaskDto: TaskUpdateDto,
    @Req() req: UserRequest
  ): Promise<TaskData> {
    const userId = req.user.userId;
    return this.tasksService.update(taskId, userId, updateTaskDto);
  }

  @Delete(':id')
  @Permissions('delete:own:tasks')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own task (Editor only, creator-check in service)' })
  @ApiResponse({ status: 204, description: 'Task successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Not the task creator.' })
  async remove(@Param('id', ParseIntPipe) taskId: number, @Req() req: UserRequest): Promise<void> {
    const userId = req.user.userId;
    return this.tasksService.remove(taskId, userId);
  }
}
