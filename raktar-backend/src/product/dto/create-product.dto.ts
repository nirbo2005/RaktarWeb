import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ProductCategory } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Fúrókalapács', description: 'A termék neve' })
  @IsString()
  @IsNotEmpty({ message: 'A termék neve nem lehet üres!' })
  nev: string;

  @ApiProperty({ example: 'Bosch', description: 'A termék gyártója' })
  @IsString()
  @IsNotEmpty({ message: 'A gyártó megadása kötelező!' })
  gyarto: string;

  @ApiPropertyOptional({ enum: ProductCategory, description: 'Termék kategóriája' })
  @IsEnum(ProductCategory, { message: 'Érvénytelen kategória!' })
  @IsOptional()
  kategoria?: ProductCategory;

  @ApiPropertyOptional({ example: 15000, description: 'Beszerzési ár (HUF)' })
  @IsInt()
  @Min(0, { message: 'A beszerzési ár nem lehet negatív!' })
  @IsOptional()
  beszerzesiAr?: number;

  @ApiProperty({ example: 25000, description: 'Eladási ár (HUF)' })
  @IsInt()
  @Min(0, { message: 'Az eladási ár nem lehet negatív!' })
  eladasiAr: number;

  @ApiPropertyOptional({ example: 2.5, description: 'A termék súlya (kg)' })
  @IsNumber()
  @Min(0.01, { message: 'A súlynak nagyobbnak kell lennie 0-nál!' })
  @IsOptional()
  suly?: number;

  @ApiPropertyOptional({ example: 10, description: 'Minimum készlet riasztáshoz' })
  @IsInt()
  @Min(0, { message: 'A minimum készlet nem lehet negatív!' })
  @IsOptional()
  minimumKeszlet?: number;
}