/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/stock/dto/create-stock.dto.ts
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsNumber, IsDate, IsPositive, Matches } from 'class-validator';

export class CreateStockDto {

  @IsString() // Ensures that the value is a string
  @IsNotEmpty() // Ensures that the value is not empty
  nev: string;

  @IsString() // Ensures that the value is a string
  @IsNotEmpty() // Ensures that the value is not empty
  gyarto: string;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value)) // Custom transformation
  @IsDate()
  lejarat: Date;

  @IsNumber() // Ensures that the value is a number
  @IsPositive() // Ensures that the number is positive
  ar: number;

  @IsNumber() // Ensures that the value is a number
  @IsPositive() // Ensures that the number is positive
  mennyiseg: number;

  @IsString() // Ensures that the value is a string
  @IsNotEmpty() // Ensures that the value is not empty
  @Matches(/^[A-Z][0-9]+-[0-9]+$/, {
    message: 'Parcella must match the format "X1-1", e.g., "A1-1" or "B2-3".',
  }) // Custom regex for parcella
  parcella: string;
}
