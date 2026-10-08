import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Matches, Min } from 'class-validator';
export class GenerateQrDto {
  @IsUUID() studentId!: string;
  @Type(() => Number) @IsInt() @Min(1) amount!: number;
  @IsOptional() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) billingMonth?: string;
  @IsOptional() @IsUUID() classId?: string;
}
