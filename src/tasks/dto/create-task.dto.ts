import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { TaskStatus } from '../task-status.enum';
import { DUE_DATE_PATTERN, toIsoUtc, trim } from './transforms';


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

  @Transform(toIsoUtc)
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(DUE_DATE_PATTERN, { message: 'dueDate must be YYYY-MM-DD or a datetime with Z or an explicit timezone offset' })
  dueDate?: string;
}
