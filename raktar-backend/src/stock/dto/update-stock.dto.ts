// src/stock/dto/update-stock.dto.ts
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsDate, IsPositive, Matches, IsOptional } from 'class-validator';

export class UpdateStockDto {

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nev?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  gyarto?: string;

  @Type(() => Date)   // ⬅️ EZ A KULCS
  @IsDate()
  lejarat: Date;

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
  @Matches(/^[A-Z][0-9]+-[0-9]+$/, {
    message: 'Parcella must match the format "X1-1", e.g., "A1-1" or "B2-3".',
  })
  @IsOptional()
  parcella?: string;
}
