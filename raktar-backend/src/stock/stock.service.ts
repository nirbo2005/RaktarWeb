//stock.service.ts
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  // Find all stock items
  async findAll() {
    return this.prisma.stock.findMany();
  }

  // Find a single stock item by ID
  async findOne(id: number) {
    return this.prisma.stock.findUnique({
      where: { id }, 
    });
  }

  // Create a new stock item
  async create(data: CreateStockDto) {
    try {
      return await this.prisma.stock.create({
        data,
      });
    } catch (error) {
      throw new Error(`Error creating stock item: ${error.message}`);
    }
  }

  // Delete a stock item by ID
  async delete(id: number) {
    try {
      return await this.prisma.stock.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(`Error deleting stock item: ${error.message}`);
    }
  }

  // Update a stock item by ID
  async update(id: number, data: Partial<UpdateStockDto>) {
    try {
      return await this.prisma.stock.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new Error(`Error updating stock item: ${error.message}`);
    }
  }

  // Create sample data (MintaAdat)
  async createMintaAdat() {
    try {
      return await this.prisma.stock.create({
        data: {
          nev: 'Minta termék',
          gyarto: 'Minta gyártó',
          lejarat: new Date('2025-12-31'),
          ar: 999,
          mennyiseg: 100,
          parcella: 'A1-1',
        },
      });
    } catch (error) {
      throw new Error(`Error creating sample stock item: ${error.message}`);
    }
  }
}
