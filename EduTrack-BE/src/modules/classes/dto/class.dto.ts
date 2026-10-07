import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

export class CreateClassDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @Type(() => Number) @IsInt() @Min(0) defaultFee!: number;
  @IsOptional() @IsString() @MaxLength(500) scheduleNote?: string;
}
export class UpdateClassDto extends PartialType(CreateClassDto) {
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class QueryClassesDto extends PaginationQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}
export class CreateEnrollmentDto {
  @IsUUID() studentId!: string;
  @IsDateString() startDate!: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) feePerSession?: number;
}
export class EndEnrollmentDto {
  @IsDateString() endDate!: string;
}
