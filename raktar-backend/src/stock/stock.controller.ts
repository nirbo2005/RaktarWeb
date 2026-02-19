//raktar-backend/src/stock/stock.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('stock')
@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @ApiOperation({ summary: 'Összes aktív termék lekérése' })
  @Get()
  @Roles(Role.NEZELODO, Role.KEZELO, Role.ADMIN)
  async getAll() {
    return this.stockService.findAll();
  }

  @ApiOperation({ summary: 'Egy termék lekérése' })
  @Get(':id')
  @Roles(Role.NEZELODO, Role.KEZELO, Role.ADMIN)
  async getOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('admin') admin?: string,
  ) {
    return this.stockService.findOne(id, admin === 'true');
  }

  @ApiOperation({ summary: 'Tömegeges törlés' })
  @Post('bulk-delete')
  @Roles(Role.KEZELO, Role.ADMIN)
  async deleteMany(
    @Body('ids') ids: number[],
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.stockService.deleteMany(ids, userId);
  }

  @ApiOperation({ summary: 'Új termék létrehozása' })
  @Post()
  @Roles(Role.KEZELO, Role.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() body: CreateStockDto & { userId: number }) {
    const { userId, ...stockData } = body;
    return this.stockService.create(stockData, userId);
  }

  @ApiOperation({ summary: 'Termék módosítása' })
  @Put(':id')
  @Roles(Role.KEZELO, Role.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateStockDto & { userId: number },
  ) {
    const { userId, ...stockData } = body;
    return this.stockService.update(id, stockData, userId);
  }

  @ApiOperation({ summary: 'Termék puha törlése' })
  @Delete(':id')
  @Roles(Role.KEZELO, Role.ADMIN)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.stockService.delete(id, userId);
  }

  @ApiOperation({ summary: 'Törölt termék visszaállítása' })
  @Patch(':id/restore')
  @Roles(Role.ADMIN) // A visszaállítás általában kritikusabb, maradjon Admin jogkör
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.stockService.restore(id, userId);
  }

  @ApiOperation({ summary: 'Visszaállítás naplóból' })
  @Post('restore-log/:logId')
  @Roles(Role.ADMIN)
  async restoreFromLog(
    @Param('logId', ParseIntPipe) logId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.stockService.restoreFromLog(logId, userId);
  }
}
