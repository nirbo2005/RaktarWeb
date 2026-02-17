import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsPositive,
  Matches,
  IsOptional,
} from 'class-validator';

export class UpdateStockDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nev?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  gyarto?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional() // Ezt hozzáadtam, hogy ne legyen kötelező minden frissítésnél
  lejarat?: Date;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  ar?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  mennyiseg?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Matches(/^[A-Z][0-9]+-[0-9]+$/, {
    message: 'Parcella must match the format "X1-1", e.g., "A1-1" or "B2-3".',
  })
  parcella?: string;
}
