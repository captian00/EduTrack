import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

export class CreateStudentNoteDto {
  @IsString() @MinLength(1) @MaxLength(2000) content!: string;
  @IsDateString() noteDate!: string;
  @IsOptional() @IsUUID() lessonId?: string;
}

export class UpdateStudentNoteDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(2000) content?: string;
  @IsOptional() @IsDateString() noteDate?: string;
}

export class QueryStudentNotesDto extends PaginationQueryDto {
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
