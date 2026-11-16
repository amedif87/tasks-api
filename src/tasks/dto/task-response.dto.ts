import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../task-status.enum';

export class TaskResponseDto {
  @ApiProperty({ format: 'uuid', example: '00000000-0000-4000-8000-000000000001' })
  id: string;

  @ApiProperty({ example: 'Preparar demo', maxLength: 120 })
  title: string;

  @ApiProperty({ type: String, nullable: true, maxLength: 2000, example: null })
  description: string | null;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })
  status: TaskStatus;

  @ApiProperty({ type: String, nullable: true, maxLength: 100, example: 'Ana' })
  assignee: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true, example: '2026-12-01T13:00:00.000Z' })
  dueDate: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-11-15T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ format: 'date-time', example: '2026-11-15T12:00:00.000Z' })
  updatedAt: string;
}

export class PaginationMetaDto {
  @ApiProperty({ type: 'integer', example: 1 })
  page: number;

  @ApiProperty({ type: 'integer', example: 20 })
  limit: number;

  @ApiProperty({ type: 'integer', example: 1 })
  total: number;

  @ApiProperty({ type: 'integer', example: 1 })
  totalPages: number;
}

export class TaskListResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  data: TaskResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class ApiErrorDto {
  @ApiProperty({ type: 'integer', example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }], example: ['title should not be empty'] })
  message: string | string[];
}
