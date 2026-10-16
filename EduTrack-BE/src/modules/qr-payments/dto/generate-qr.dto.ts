import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
export class GenerateQrDto {
  @IsUUID() studentId!: string;
  @Type(() => Number) @IsInt() @Min(1) amount!: number;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { each: true })
  billingMonths!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  classIds!: string[];
}
