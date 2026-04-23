import {
  IsOptional,
  IsInt,
  IsString,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetLogsQueryDto {
  @ApiPropertyOptional({ example: 5, description: 'Szűrés egy adott felhasználó (célpont) eseményeire' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  })
  @IsInt()
  targetUserId?: number;

  @ApiPropertyOptional({ example: 'CREATE_PRODUCT', description: 'Szűrés a végrehajtott művelet típusa alapján' })
  @IsOptional()
  @IsString()
  muvelet?: string;

  @ApiPropertyOptional({ example: 12, description: 'Szűrés egy adott terméket érintő eseményekre' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number(value);
  })
  @IsInt()
  productId?: number;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z', description: 'Kezdő dátum (ISO 8601 formátum)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.999Z', description: 'Záró dátum (ISO 8601 formátum)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  endDate?: string;

  @ApiPropertyOptional({ example: true, description: 'Adminisztrátori teljes nézet kérése (jogosultság ellenőrzött)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  admin?: boolean;
}