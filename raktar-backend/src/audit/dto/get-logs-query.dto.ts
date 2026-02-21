//raktar-backend/src/audit/dto/get-logs-query.dto.ts
import { IsOptional, IsInt, IsString, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetLogsQueryDto {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  })
  targetUserId?: number;

  @IsOptional()
  @IsString()
  muvelet?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  })
  stockId?: number;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  admin?: boolean;
}
