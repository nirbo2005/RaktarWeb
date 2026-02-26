//raktar-backend/src/batch/dto/create-batch.dto.ts
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  Matches,
  Min,
} from 'class-validator';

export class CreateBatchDto {
  @IsInt()
  productId: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-D][1-5]-[1-4]$/, {
    message:
      'Parcella formátuma kötelezően: [Részleg(A-D)][Sor(1-5)]-[Oszlop(1-4)], pl. "A1-1" vagy "C5-4".',
  })
  parcella: string;

  @IsInt()
  @Min(1)
  mennyiseg: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lejarat?: Date;
}
