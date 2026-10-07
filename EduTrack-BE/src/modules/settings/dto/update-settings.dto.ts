import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
function emptyToUndefined(params: TransformFnParams): unknown {
  const value: unknown = params.value;
  return value === '' ? undefined : value;
}

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MaxLength(120) displayName?: string;
  @IsOptional() @IsString() @MaxLength(20) bankCode?: string;
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @Matches(/^\d{6,20}$/)
  bankAccountNumber?: string;
  @IsOptional() @IsString() @MaxLength(120) bankAccountName?: string;
  @IsOptional() @IsBoolean() billExcusedAbsence?: boolean;
  @IsOptional() @IsBoolean() billUnexcusedAbsence?: boolean;
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  transferDescriptionTemplate?: string;
}
