import { PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { LessonStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
export class CreateLessonDto {
  @IsUUID() classId!: string;
  @IsDateString() lessonDate!: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime?: string;
  @IsOptional() @IsString() @MaxLength(500) topic?: string;
}
export class UpdateLessonDto extends PartialType(CreateLessonDto) {}
export class QueryLessonsDto extends PaginationQueryDto {
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @IsEnum(LessonStatus) status?: LessonStatus;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
