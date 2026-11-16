import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { TaskStatus } from '../task-status.enum';
import { trim } from './transforms';

export class ListTasksQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filtrar por estado.' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ minLength: 1, maxLength: 100, example: 'Ana', description: 'Coincidencia exacta sin distinguir mayúsculas ASCII; combinable con estado.' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  assignee?: string;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 1_000_000, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000) // Con limit <= 100 el desplazamiento permanece dentro de enteros seguros.
  page: number = 1;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
