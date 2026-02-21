//raktar-backend/src/product/dto/create-product.dto.ts
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt, IsNumber, IsDate, Min, Matches } from 'class-validator';

export class CreateProductDto {
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
  @Matches(/^[AB][1-5]-[1-4]$/, {
    message: 'Parcella formátuma kötelezően: [Részleg(A-B)][Sor(1-5)]-[Oszlop(1-4)], pl. "A1-1" vagy "B5-4".',
  })
  parcella: string;
}
