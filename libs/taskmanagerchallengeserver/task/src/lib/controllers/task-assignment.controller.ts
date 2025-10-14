import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Get,
  NotFoundException
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@task-manager-nx-workspace/shared/auth/lib/guards/auth.guard';
import { PermissionsGuard } from '@task-manager-nx-workspace/shared/auth/lib/guards/permissions.guard';
import { Roles } from '@task-manager-nx-workspace/shared/auth/lib/decorators/roles.decorator';
import { TaskService } from '../services/task.service';
import { TaskAssignmentService } from '../services/task-assignment.service';
import { CreateTaskAssignmentDto } from '../dto/create-task-assignment.dto';
import { TaskAssignmentDto } from '../dto/task-assignment.dto';


@ApiTags('task-assignments')
@Controller('task-assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TaskAssignmentController {
  constructor(
    private readonly taskService: TaskService,
    private readonly taskAssignmentService: TaskAssignmentService,
  ) { }

  /**
   * @description Assigns a task to a user. Used if the client manages assignments 
   * via a flat /task-assignments endpoint rather than nested under /tasks.
   * (Permission: assign:tasks - Editor & Viewer Roles)
   */
  @Post()
  @Roles('assign:tasks')
  async createAssignment(@Body() createAssignmentDto: CreateTaskAssignmentDto & { taskId: number }): Promise<TaskAssignmentDto> {
    const { taskId, ...assignmentDto } = createAssignmentDto;
    const assignment = await this.taskService.assignTask(taskId, assignmentDto);
    return new TaskAssignmentDto(assignment);
  }

  /**
   * @description Removes a specific assignment record by its ID.
   * (Permission: unassign:tasks - Editor & Viewer Roles)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('unassign:tasks')
  async removeAssignment(@Param('id', ParseIntPipe) assignmentId: number): Promise<void> {
    throw new NotFoundException(`Endpoint not implemented for assignment ID deletion. Use DELETE /tasks/:taskId/unassign instead.`);
  }

  /**
   * @description Retrieves a specific assignment record by its ID.
   * (Permission: read:tasks - Editor & Viewer Roles)
   */
  @Get(':id')
  @Roles('read:tasks')
  async getAssignmentById(@Param('id', ParseIntPipe) assignmentId: number): Promise<TaskAssignmentDto> {
    const assignment = await this.taskAssignmentService.getAssignmentByAssignmentId(assignmentId);

    if (!assignment) {
      throw new NotFoundException(`Task assignment with ID ${assignmentId} not found.`);
    }
    return new TaskAssignmentDto(assignment);
  }
}
