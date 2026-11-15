import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';
import { TaskStatus } from '../task-status.enum';
import { DUE_DATE_PATTERN, toIsoUtc, trim } from './transforms';

const present = (_: unknown, v: unknown) => v !== undefined;

/**
 * PATCH parcial. Los campos opcionales de la tarea (descripción, responsable, fecha límite)
 * aceptan `null` para vaciarlos; título y estado nunca pueden ser null.
 */
export class UpdateTaskDto {
  @Transform(trim)
  @ValidateIf(present)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ValidateIf(present)
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  assignee?: string | null;

  @Transform(toIsoUtc)
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(DUE_DATE_PATTERN, { message: 'dueDate must be YYYY-MM-DD or a datetime with Z or an explicit timezone offset' })
  dueDate?: string | null;
}
