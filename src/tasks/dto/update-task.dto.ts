import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { TaskStatus } from '../task-status.enum';
import { DUE_DATE_PATTERN, toIsoUtc, trim } from './transforms';

const present = (_: unknown, v: unknown) => v !== undefined;

/**
 * PATCH parcial. Los campos opcionales de la tarea (descripción, responsable, fecha límite)
 * aceptan `null` para vaciarlos; título y estado nunca pueden ser null.
 */
export class UpdateTaskDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 120, example: 'Preparar demo actualizada', description: 'No admite null ni texto vacío.' })
  @Transform(trim)
  @ValidateIf(present)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000, example: 'Actualizar los ejemplos.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.IN_PROGRESS, description: 'No admite null.' })
  @ValidateIf(present)
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ type: String, nullable: true, minLength: 1, maxLength: 100, example: 'Ana', description: 'null elimina el responsable.' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  assignee?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, pattern: DUE_DATE_PATTERN.source, example: '2026-12-01T10:00:00-03:00', description: 'YYYY-MM-DD o fecha/hora con zona explícita. null elimina la fecha límite.' })
  @Transform(toIsoUtc)
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(DUE_DATE_PATTERN, { message: 'dueDate must be YYYY-MM-DD or a datetime with Z or an explicit timezone offset' })
  dueDate?: string | null;
}
