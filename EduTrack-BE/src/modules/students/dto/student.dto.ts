import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

export class CreateStudentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsOptional() @IsString() @MaxLength(120) parentName?: string;
  @IsOptional() @IsString() @MaxLength(30) parentPhone?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdateStudentDto extends PartialType(CreateStudentDto) {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

export class QueryStudentsDto extends PaginationQueryDto {
  @IsOptional() @IsString() search?: string;
  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional() @IsBoolean() isActive?: boolean;
}
