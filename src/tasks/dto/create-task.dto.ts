import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskStatus } from '../task-status.enum';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateTaskDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  assignee?: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;
}
