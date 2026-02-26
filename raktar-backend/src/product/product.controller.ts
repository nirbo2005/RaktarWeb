//raktar-backend/src/product/product.controller.ts
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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('product')
@Controller('product')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: 'Összes aktív termék lekérése' })
  @Get()
  @Roles(Role.NEZELODO, Role.KEZELO, Role.ADMIN)
  async getAll() {
    return this.productService.findAll();
  }

  @ApiOperation({ summary: 'Egy termék lekérése' })
  @Get(':id')
  @Roles(Role.NEZELODO, Role.KEZELO, Role.ADMIN)
  async getOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('admin') admin?: string,
  ) {
    return this.productService.findOne(id, admin === 'true');
  }

  @ApiOperation({ summary: 'Tömeges törlés' })
  @Post('bulk-delete')
  @Roles(Role.KEZELO, Role.ADMIN)
  async deleteMany(
    @Body('ids') ids: number[],
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return this.productService.deleteMany(ids, userId);
  }

  @ApiOperation({ summary: 'Új termék létrehozása' })
  @Post()
  @Roles(Role.KEZELO, Role.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async create(@Body() body: CreateProductDto & { userId: number }) {
    const { userId, ...productData } = body;
    return this.productService.create(productData, userId);
  }

  @ApiOperation({ summary: 'Termék módosítása' })
  @Put(':id')
  @Roles(Role.KEZELO, Role.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProductDto & { userId: number },
  ) {
    const { userId, ...productData } = body;
    return this.productService.update(id, productData, userId);
  }

  @ApiOperation({ summary: 'Termék puha törlése' })
  @Delete(':id')
  @Roles(Role.KEZELO, Role.ADMIN)
  async delete(
    @Param('id', ParseIntPipe) id: number,

    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.productService.delete(id, userId);
  }

  @ApiOperation({ summary: 'Törölt termék visszaállítása' })
  @Patch(':id/restore')
  @Roles(Role.ADMIN)
  async restore(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.productService.restore(id, userId);
  }

  @ApiOperation({ summary: 'Visszaállítás naplóból' })
  @Post('restore-log/:logId')
  @Roles(Role.ADMIN)
  async restoreFromLog(
    @Param('logId', ParseIntPipe) logId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.productService.restoreFromLog(logId, userId);
  }
}
