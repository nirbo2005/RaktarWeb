//stock.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ApiTags } from '@nestjs/swagger'; // For API documentation (optional)
import { UsePipes, ValidationPipe } from '@nestjs/common'; // For validation

@ApiTags('stock') // Swagger documentation tag for stock endpoints
@Controller('stock') // Base route for stock endpoints
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // Get all stock items
  @Get()
  async getAll() {
    return this.stockService.findAll();
  }

  // Get a single stock item by its ID
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.stockService.findOne(Number(id));
  }

  // Create a new stock item
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // Enables DTO validation
  async create(@Body() body: CreateStockDto) {
    return this.stockService.create(body);
  }

  // Update a stock item by its ID
  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true })) // Enables DTO validation
  async update(@Param('id') id: string, @Body() body: UpdateStockDto) {
    return this.stockService.update(Number(id), body);
  }

  // Delete a stock item by its ID
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.stockService.delete(Number(id));
  }

  // Create sample stock data
  @Post('mintaadat')
  async createMintaAdat() {
    return this.stockService.createMintaAdat();
  }
}
