import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('batch')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized - Nincs bejelentkezve vagy érvénytelen token' })
@ApiResponse({ status: 403, description: 'Forbidden - Nincs megfelelő jogosultság' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  private getUserId(req: any, queryUserId?: string): number {
    const idFromQuery = queryUserId ? parseInt(queryUserId, 10) : NaN;
    if (!isNaN(idFromQuery)) return idFromQuery;

    const idFromToken = req.user?.id || req.user?.userId || req.user?.sub;
    const parsedTokenId = parseInt(idFromToken, 10);

    if (isNaN(parsedTokenId)) {
      throw new BadRequestException(
        'Nem azonosítható felhasználó (userId missing)',
      );
    }
    return parsedTokenId;
  }

  @ApiOperation({ summary: 'A raktár jelenlegi telítettségi térképének lekérése' })
  @ApiResponse({ status: 200, description: 'Sikeres lekérdezés' })
  @Roles(Role.KEZELO, Role.ADMIN)
  @Get('warehouse-map')
  getWarehouseMap() {
    return this.batchService.getWarehouseMap();
  }

  @ApiOperation({ summary: 'Intelligens parcellajavaslat kérése betároláshoz' })
  @ApiResponse({ status: 200, description: 'Javasolt parcellák listája' })
  @ApiQuery({ name: 'productId', required: true, type: Number })
  @ApiQuery({ name: 'mennyiseg', required: true, type: Number })
  @ApiQuery({ name: 'weight', required: false, type: String })
  @Roles(Role.KEZELO, Role.ADMIN)
  @Get('suggest-placement')
  suggestPlacement(
    @Query('productId', ParseIntPipe) productId: number,
    @Query('mennyiseg', ParseIntPipe) mennyiseg: number,
    @Query('weight') weight?: string,
  ) {
    const parsedWeight = weight ? parseFloat(weight) : undefined;
    return this.batchService.suggestPlacement(productId, mennyiseg, parsedWeight);
  }

  @ApiOperation({ summary: 'Tömeges betárolás (több tétel egyszerre)' })
  @ApiResponse({ status: 201, description: 'Tételek sikeresen betárolva' })
  @ApiBody({ type: [CreateBatchDto] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @Roles(Role.KEZELO, Role.ADMIN)
  @Post('bulk')
  createBulk(
    @Body() splits: CreateBatchDto[],
    @Request() req,
    @Query('userId') userId?: string,
  ) {
    return this.batchService.createBulk(splits, this.getUserId(req, userId));
  }

  @ApiOperation({ summary: 'Raktár újrarendezése / optimalizálása' })
  @ApiResponse({ status: 201, description: 'A raktár újrarendezése sikeresen befejeződött' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @Roles(Role.ADMIN)
  @Post('sort-warehouse')
  sortWarehouse(@Request() req, @Query('userId') userId?: string) {
    return this.batchService.sortWarehouse(this.getUserId(req, userId));
  }

  @ApiOperation({ summary: 'Új batch (tétel) létrehozása és betárolása' })
  @ApiResponse({ status: 201, description: 'Tétel sikeresen létrehozva' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @Roles(Role.KEZELO, Role.ADMIN)
  @Post()
  create(
    @Body() createBatchDto: CreateBatchDto,
    @Request() req,
    @Query('userId') userId?: string,
  ) {
    return this.batchService.create(
      createBatchDto,
      this.getUserId(req, userId),
    );
  }

  @ApiOperation({ summary: 'Egy meglévő tétel mennyiségének vagy adatainak módosítása' })
  @ApiResponse({ status: 200, description: 'Tétel sikeresen frissítve' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @Roles(Role.KEZELO, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBatchDto: UpdateBatchDto,
    @Request() req,
    @Query('userId') userId?: string,
  ) {
    return this.batchService.update(
      id,
      updateBatchDto,
      this.getUserId(req, userId),
    );
  }

  @ApiOperation({ summary: 'Egy tétel törlése' })
  @ApiResponse({ status: 200, description: 'Tétel sikeresen törölve' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @Roles(Role.KEZELO, Role.ADMIN)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Query('userId') userId?: string,
  ) {
    return this.batchService.remove(id, this.getUserId(req, userId));
  }
}