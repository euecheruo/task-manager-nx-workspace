import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Logger, HttpStatus } from '@nestjs/common';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto } from '../dtos/create-task.dtos';
import { UpdateTaskDto } from '../dtos/update-task.dtos';
import { TaskFilterQuery } from '../dtos/task-filter.query';
import { SingleTaskResponse, TaskResponseDto } from '../dtos/task-response.dtos';
import { JwtAuthGuard } from '../../../../auth/src/lib/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../../shared/src/lib/guards/permission.guard';
import { TaskOwnershipGuard } from '../guards/task-ownership.guard';
import { TaskAssignmentStateGuard } from '../guards/task-assignment-state.guard';
import { TaskAssignedToUserGuard } from '../guards/task-assigned-to-user.guard';
import { CurrentUser } from '../../../../shared/src/lib/decorators/current-user.decorator';
import { RequirePermission } from '../../../../shared/src/lib/decorators/permission.decorator';


@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  private readonly logger = new Logger(TasksController.name);
  constructor(private tasksService: TasksService) { }

  /**
   * GET /tasks - List tasks with pagination and filtering.
   * Requires 'read:tasks' permission.
   */
  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('read:tasks')
  async findAll(@Query() query: TaskFilterQuery): Promise<TaskResponseDto> {
    this.logger.log(`Listing tasks. Filters: ${JSON.stringify(query)}`);
    return this.tasksService.findAll(query);
  }

  /**
   * GET /tasks/:id - Retrieve a single task.
   * Requires 'read:tasks' permission.
   */
  @Get(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('read:tasks')
  async findOne(@Param('id') taskId: number): Promise<SingleTaskResponse> {
    this.logger.log(`Fetching task ID: ${taskId}`);
    return this.tasksService.findOne(taskId) as unknown as SingleTaskResponse;
  }

  /**
   * POST /tasks - Create a new task.
   * Requires 'create:tasks' permission.
   */
  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('create:tasks')
  async create(@Body() createTaskDto: CreateTaskDto, @CurrentUser() user: { userId: number }): Promise<SingleTaskResponse> {
    this.logger.log(`User ${user.userId} attempting to create task: ${createTaskDto.title}`);
    return this.tasksService.create(createTaskDto, user.userId) as unknown as SingleTaskResponse;
  }

  /**
   * PATCH /tasks/:id - Update an existing task.
   * Requires 'update:own:tasks' permission AND TaskOwnershipGuard check.
   */
  @Patch(':id')
  @UseGuards(PermissionGuard, TaskOwnershipGuard)
  @RequirePermission('update:own:tasks')
  async update(@Param('id') taskId: number, @Body() updateTaskDto: UpdateTaskDto, @CurrentUser() user: { userId: number }): Promise<SingleTaskResponse> {
    this.logger.log(`User ${user.userId} updating task ID: ${taskId}`);
    return this.tasksService.update(taskId, updateTaskDto) as unknown as SingleTaskResponse;
  }

  /**
   * DELETE /tasks/:id - Delete a task.
   * Requires 'delete:own:tasks' permission AND TaskOwnershipGuard check.
   */
  @Delete(':id')
  @UseGuards(PermissionGuard, TaskOwnershipGuard)
  @RequirePermission('delete:own:tasks')
  async delete(@Param('id') taskId: number, @CurrentUser() user: { userId: number }): Promise<{ success: boolean }> {
    this.logger.log(`User ${user.userId} deleting task ID: ${taskId}`);
    await this.tasksService.delete(taskId);
    return { success: true };
  }

  /**
   * POST /tasks/:id/assign - Assign an unassigned task to a user.
   * Requires 'assign:tasks' permission AND TaskAssignmentStateGuard check (must be unassigned).
   */
  @Post(':id/assign')
  @UseGuards(PermissionGuard, TaskAssignmentStateGuard)
  @RequirePermission('assign:tasks')
  async assign(@Param('id') taskId: number, @Body('assignedUserId') assignedUserId: number, @CurrentUser() user: { userId: number }): Promise<SingleTaskResponse> {
    this.logger.log(`User ${user.userId} assigning task ID ${taskId} to user ${assignedUserId}`);
    return this.tasksService.assign(taskId, assignedUserId) as unknown as SingleTaskResponse;
  }

  /**
   * POST /tasks/:id/unassign - Unassign a currently assigned task.
   * Requires 'unassign:tasks' permission AND TaskAssignmentStateGuard check (must be assigned).
   */
  @Post(':id/unassign')
  @UseGuards(PermissionGuard, TaskAssignmentStateGuard)
  @RequirePermission('unassign:tasks')
  async unassign(@Param('id') taskId: number, @CurrentUser() user: { userId: number }): Promise<SingleTaskResponse> {
    this.logger.log(`User ${user.userId} unassigning task ID ${taskId}`);
    return this.tasksService.unassign(taskId) as unknown as SingleTaskResponse;
  }

  /**
   * PATCH /tasks/:id/complete - Mark an assigned task as complete.
   * Requires 'mark:assigned:tasks' permission AND TaskAssignedToUserGuard check (must be assigned to requester).
   */
  @Patch(':id/complete')
  @UseGuards(PermissionGuard, TaskAssignedToUserGuard)
  @RequirePermission('mark:assigned:tasks')
  async complete(@Param('id') taskId: number, @CurrentUser() user: { userId: number }): Promise<SingleTaskResponse> {
    this.logger.log(`User ${user.userId} marking task ID ${taskId} as complete.`);
    return this.tasksService.markComplete(taskId) as unknown as SingleTaskResponse;
  }

  /**
   * PATCH /tasks/:id/incomplete - Mark a completed task as incomplete.
   * Requires 'unmark:assigned:tasks' permission AND TaskAssignedToUserGuard check (must be assigned to requester).
   */
  @Patch(':id/incomplete')
  @UseGuards(PermissionGuard, TaskAssignedToUserGuard)
  @RequirePermission('unmark:assigned:tasks')
  async incomplete(@Param('id') taskId: number, @CurrentUser() user: { userId: number }): Promise<SingleTaskResponse> {
    this.logger.log(`User ${user.userId} marking task ID ${taskId} as incomplete.`);
    return this.tasksService.markIncomplete(taskId) as unknown as SingleTaskResponse;
  }
}
