import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { ProductCategory } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'A termék neve nem lehet üres!' })
  nev: string;

  @IsString()
  @IsNotEmpty({ message: 'A gyártó megadása kötelező!' })
  gyarto: string;

  @IsEnum(ProductCategory, { message: 'Érvénytelen kategória!' })
  @IsOptional()
  kategoria?: ProductCategory;

  @IsInt()
  @Min(0, { message: 'A beszerzési ár nem lehet negatív!' })
  @IsOptional()
  beszerzesiAr?: number;

  @IsInt()
  @Min(0, { message: 'Az eladási ár nem lehet negatív!' })
  eladasiAr: number;

  @IsNumber()
  @Min(0.01, { message: 'A súlynak nagyobbnak kell lennie 0-nál!' })
  @IsOptional()
  suly?: number;

  @IsInt()
  @Min(0, { message: 'A minimum készlet nem lehet negatív!' })
  @IsOptional()
  minimumKeszlet?: number;
}
