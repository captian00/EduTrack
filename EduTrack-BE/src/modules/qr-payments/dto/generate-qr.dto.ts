import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';
export class GenerateQrDto {
  @IsUUID() studentId!: string;
  @Type(() => Number) @IsInt() @Min(1) amount!: number;
}
