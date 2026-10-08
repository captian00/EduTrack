import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  Matches,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';
export class CreatePaymentDto {
  @IsUUID() studentId!: string;
  @Type(() => Number) @IsInt() @Min(1) amount!: number;
  @IsDateString() paidAt!: string;
  @IsEnum(PaymentMethod) method!: PaymentMethod;
  @IsOptional() @IsString() @MaxLength(120) reference?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) billingMonth?: string;
  @IsOptional() @IsUUID() classId?: string;
}
export class VoidPaymentDto {
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}
export class QueryPaymentsDto extends PaginationQueryDto {
  @IsOptional() @IsUUID() studentId?: string;
  @IsOptional() @IsEnum(PaymentStatus) status?: PaymentStatus;
  @IsOptional() @IsEnum(PaymentMethod) method?: PaymentMethod;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
