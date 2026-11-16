import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { TaskStatus } from '../task-status.enum';
import { DUE_DATE_PATTERN, toIsoUtc, trim } from './transforms';


export class CreateTaskDto {
  @ApiProperty({ example: 'Preparar demo', minLength: 1, maxLength: 120, description: 'Título; se recortan espacios en los extremos.' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000, example: 'Preparar los ejemplos para la presentación.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, default: TaskStatus.PENDING, nullable: true, description: 'Si se omite o es null, se usa pending.' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ type: String, nullable: true, minLength: 1, maxLength: 100, example: 'Ana' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  assignee?: string;

  @ApiPropertyOptional({ type: String, nullable: true, pattern: DUE_DATE_PATTERN.source, example: '2026-12-01T10:00:00-03:00', description: 'YYYY-MM-DD (medianoche UTC) o fecha/hora con zona explícita. Se normaliza a UTC.' })
  @Transform(toIsoUtc)
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(DUE_DATE_PATTERN, { message: 'dueDate must be YYYY-MM-DD or a datetime with Z or an explicit timezone offset' })
  dueDate?: string;
}
