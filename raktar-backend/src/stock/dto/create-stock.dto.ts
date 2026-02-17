//raktar-backend/src/stock/dto/create-stock.dto.ts
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt, IsNumber, IsDate, Min, Matches } from 'class-validator';

export class CreateStockDto {
  @IsString()
  @IsNotEmpty({ message: 'A termék neve nem lehet üres!' })
  nev: string;

  @IsString()
  @IsNotEmpty({ message: 'A gyártó megadása kötelező!' })
  gyarto: string;

  @Type(() => Date)
  @IsDate({ message: 'Érvénytelen dátum formátum!' })
  lejarat: Date;

  @IsNumber()
  @Min(0, { message: 'Az ár nem lehet negatív!' })
  ar: number;

  @IsInt()
  @Min(0, { message: 'A mennyiség nem lehet negatív!' })
  mennyiseg: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][0-9]+-[0-9]+$/, {
    message: 'Parcella formátuma kötelezően: "X1-1", pl. "A1-1" vagy "B2-3".',
  })
  parcella: string;
}
