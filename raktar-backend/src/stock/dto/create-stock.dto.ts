import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsPositive,
  Matches,
} from 'class-validator';

export class CreateStockDto {
  @IsString()
  @IsNotEmpty()
  nev: string;

  @IsString()
  @IsNotEmpty()
  gyarto: string;

  @Type(() => Date)
  @IsDate()
  lejarat: Date;

  @IsNumber()
  @IsPositive()
  ar: number;

  @IsNumber()
  @IsPositive()
  mennyiseg: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][0-9]+-[0-9]+$/, {
    message: 'Parcella must match the format "X1-1", e.g., "A1-1" or "B2-3".',
  })
  parcella: string;
}
