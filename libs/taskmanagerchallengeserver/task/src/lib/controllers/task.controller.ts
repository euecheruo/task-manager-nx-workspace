import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '@task-manager-nx-workspace/shared/auth/lib/guards/auth.guard';
import { PermissionsGuard } from '@task-manager-nx-workspace/shared/auth/lib/guards/permissions.guard';
import { Roles } from '@task-manager-nx-workspace/shared/auth/lib/decorators/roles.decorator';
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskDto } from '../dto/task.dto';
import { TaskAssignmentService } from '../services/task-assignment.service';
import { CreateTaskAssignmentDto } from '../dto/create-task-assignment.dto';
import { TaskAssignmentDto } from '../dto/task-assignment.dto';


@ApiTags('tasks')
@Controller('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly assignmentService: TaskAssignmentService,
  ) { }

  /**
   * @description Creates a new task. (Permission: create:tasks - Editor Role)
   */
  @Post()
  @Roles('create:tasks')
  async create(@Req() req: Request, @Body() createTaskDto: CreateTaskDto): Promise<TaskDto> {
    const task = await this.taskService.create(req.user, createTaskDto);
    return new TaskDto(task);
  }

  /**
   * @description Retrieves all tasks. (Permission: read:tasks - Editor & Viewer Roles)
   */
  @Get()
  @Roles('read:tasks')
  async findAll(): Promise<TaskDto[]> {
    const tasks = await this.taskService.findAll();
    return tasks.map(task => new TaskDto(task));
  }

  /**
   * @description Updates an existing task. (Permission: update:own:tasks - Editor Role / Creator)
   */
  @Patch(':id')
  @Roles('update:own:tasks')
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) taskId: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskDto> {
    const task = await this.taskService.update(req.user, taskId, updateTaskDto);
    return new TaskDto(task);
  }

  /**
   * @description Deletes a task. (Permission: delete:own:tasks - Editor Role / Creator)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('delete:own:tasks')
  async remove(@Req() req: Request, @Param('id', ParseIntPipe) taskId: number): Promise<void> {
    await this.taskService.remove(req.user, taskId);
  }

  /**
   * @description Toggles the completion status of an assigned task.
   * (Permission: mark:assigned:tasks OR unmark:assigned:tasks - Editor & Viewer Roles / Assignee)
   */
  @Patch(':id/toggle-complete')
  @Roles('mark:assigned:tasks', 'unmark:assigned:tasks')
  async toggleComplete(
    @Req() req: Request,
    @Param('id', ParseIntPipe) taskId: number,
  ): Promise<TaskDto> {
    const task = await this.taskService.toggleComplete(req.user, taskId);
    return new TaskDto(task);
  }

  /**
   * @description Assigns a task to a user. (Permission: assign:tasks - Editor & Viewer Roles)
   */
  @Post(':id/assign')
  @Roles('assign:tasks')
  async assignTask(
    @Param('id', ParseIntPipe) taskId: number,
    @Body() createAssignmentDto: CreateTaskAssignmentDto,
  ): Promise<TaskAssignmentDto> {
    const assignment = await this.taskService.assignTask(taskId, createAssignmentDto);
    return new TaskAssignmentDto(assignment);
  }

  /**
   * @description Removes assignment from a task (unassigns). (Permission: unassign:tasks - Editor & Viewer Roles)
   */
  @Delete(':id/unassign')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('unassign:tasks')
  async unassignTask(@Param('id', ParseIntPipe) taskId: number): Promise<void> {
    await this.taskService.unassignTask(taskId);
  }

  /**
   * @description Retrieves the current assignment status for a task. (Helper/Read endpoint)
   */
  @Get(':id/assignment')
  @Roles('read:tasks')
  async getAssignment(@Param('id', ParseIntPipe) taskId: number): Promise<TaskAssignmentDto | null> {
    const assignment = await this.assignmentService.getAssignmentByTaskId(taskId);
    return assignment ? new TaskAssignmentDto(assignment) : null;
  }
}
