import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { TaskStatus } from '../task-status.enum';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
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

  @IsOptional()
  @IsISO8601()
  dueDate?: string | null;
}
