import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from '../entities/task.entity';
import { UserEntity } from '@task-manager-nx-workspace/shared/database/lib/entities/user.entity';
import { AuthService } from '@task-manager-nx-workspace/shared/auth/lib/services/auth.service';
import { TaskAssignmentEntity } from '../entities/task-assignment.entity';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { CreateTaskAssignmentDto } from '../dto/create-task-assignment.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(TaskAssignmentEntity)
    private readonly assignmentRepository: Repository<TaskAssignmentEntity>,
    private readonly authService: AuthService,
  ) { }

  private async getLocalUserIdFromPayload(userPayload: any): Promise<number> {
    const auth0Id = this.authService.getAuth0UserId(userPayload);
    const user = await this.userRepository.findOne({
      where: { auth0Id },
      select: ['id']
    });

    if (!user || !user.id) {
      throw new UnauthorizedException('Local user record not found for the authenticated identity.');
    }
    return user.id;
  }

  private checkTaskOwnership(task: TaskEntity, localUserId: number): void {
    if (task.creatorId !== localUserId) {
      throw new ForbiddenException('You can only perform this action on tasks that you have created.');
    }
  }

  private async checkTaskAssignment(taskId: number, localUserId: number): Promise<TaskAssignmentEntity | null> {
    return this.assignmentRepository.findOne({
      where: { taskId, assignedUserId: localUserId }
    });
  }

  /**
   * Creates a new task. (Permission: create:tasks)
   */
  async create(userPayload: any, createTaskDto: CreateTaskDto): Promise<TaskEntity> {
    const creatorId = await this.getLocalUserIdFromPayload(userPayload);
    const newTask = new TaskEntity(
      createTaskDto.title,
      creatorId,
      createTaskDto.description,
    );
    return this.taskRepository.save(newTask);
  }

  /**
   * Finds all tasks. (Permission: read:tasks)
   */
  async findAll(): Promise<TaskEntity[]> {
    return this.taskRepository.find({
      relations: ['creator', 'assignments', 'assignments.assignedUser']
    });
  }

  /**
   * Updates an existing task. (Permission: update:own:tasks)
   */
  async update(userPayload: any, taskId: number, updateTaskDto: UpdateTaskDto): Promise<TaskEntity> {
    const localUserId = await this.getLocalUserIdFromPayload(userPayload);
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task with ID ${taskId} not found.`);

    this.checkTaskOwnership(task, localUserId);

    const updatedTask = this.taskRepository.merge(task, updateTaskDto);

    if (updateTaskDto.isCompleted === true && task.isCompleted === false) {
      updatedTask.completedAt = new Date();
    } else if (updateTaskDto.isCompleted === false && task.isCompleted === true) {
      updatedTask.completedAt = null;
    }

    return this.taskRepository.save(updatedTask);
  }

  /**
   * Deletes a task. (Permission: delete:own:tasks)
   */
  async remove(userPayload: any, taskId: number): Promise<void> {
    const localUserId = await this.getLocalUserIdFromPayload(userPayload);
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task with ID ${taskId} not found.`);

    this.checkTaskOwnership(task, localUserId);

    await this.taskRepository.delete(taskId);
  }

  /**
   * STATUS CHANGE METHOD (Permission: mark:assigned:tasks / unmark:assigned:tasks)
   */
  async toggleComplete(userPayload: any, taskId: number): Promise<TaskEntity> {
    const localUserId = await this.getLocalUserIdFromPayload(userPayload);

    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task with ID ${taskId} not found.`);

    const assignment = await this.checkTaskAssignment(taskId, localUserId);

    if (!assignment) {
      throw new ForbiddenException('You can only change the status of tasks assigned to you.');
    }

    task.isCompleted = !task.isCompleted;

    if (task.isCompleted) {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    return this.taskRepository.save(task);
  }

  /**
   * Assigns a task. (RBAC: Both roles have assign:tasks permission).
   */
  async assignTask(taskId: number, createAssignmentDto: CreateTaskAssignmentDto): Promise<TaskAssignmentEntity> {
    const { assignedUserId } = createAssignmentDto;

    const taskCount = await this.taskRepository.count({ where: { id: taskId } });
    if (taskCount === 0) throw new NotFoundException(`Task with ID ${taskId} not found.`);

    const userCount = await this.userRepository.count({ where: { id: assignedUserId } });
    if (userCount === 0) throw new NotFoundException(`Assigned user ID ${assignedUserId} not found.`);

    let assignment = await this.assignmentRepository.findOne({ where: { taskId } });

    if (assignment) {
      if (assignment.assignedUserId === assignedUserId) {
        throw new BadRequestException('Task is already assigned to this user.');
      }
      assignment.assignedUserId = assignedUserId;
      assignment.assignedAt = new Date();
    } else {
      assignment = new TaskAssignmentEntity(taskId, assignedUserId);
    }

    return this.assignmentRepository.save(assignment);
  }

  /**
   * Removes a task assignment (unassigns the user). (Permission: unassign:tasks)
   */
  async unassignTask(taskId: number): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({ where: { taskId } });

    if (!assignment) {
      throw new NotFoundException(`Assignment record for task ID ${taskId} not found.`);
    }

    await this.assignmentRepository.delete(assignment.id);
  }
}
