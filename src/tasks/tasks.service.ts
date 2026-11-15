import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private readonly repo: Repository<Task>) {}

  create(dto: CreateTaskDto): Promise<Task> {
    const task = this.repo.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status ?? TaskStatus.PENDING,
      assignee: dto.assignee ?? null,
      dueDate: dto.dueDate ?? null,
    });
    return this.repo.save(task);
  }

  findAll(): Promise<Task[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.repo.findOneBy({ id });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.repo.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.repo.remove(task);
  }
}
