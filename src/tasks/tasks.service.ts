import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './task.entity';
import { TaskStatus } from './task-status.enum';

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

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

  async findAll(query: ListTasksQueryDto): Promise<Paginated<Task>> {
    const { status, assignee, page, limit } = query;
    const qb = this.repo.createQueryBuilder('task');

    if (status) qb.andWhere('task.status = :status', { status });
    // Responsable: coincidencia exacta pero sin distinguir mayúsculas ("ana" == "Ana").
    if (assignee) qb.andWhere('LOWER(task.assignee) = LOWER(:assignee)', { assignee });

    const [data, total] = await qb
      .orderBy('task.createdAt', 'DESC')
      .addOrderBy('task.id', 'ASC') // desempate determinista: sin esto la paginación puede repetir/saltar filas
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
