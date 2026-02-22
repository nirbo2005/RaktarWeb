import { Controller, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe, Query, BadRequestException } from '@nestjs/common';
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  /**
   * Segédfüggvény a userId kinyerésére. 
   * Elsődlegesen a query paraméterből (amit a frontend küld), 
   * másodlagosan a JWT tokenből próbálja venni.
   */
  private getUserId(req: any, queryUserId?: string): number {
    const idFromQuery = queryUserId ? parseInt(queryUserId, 10) : NaN;
    if (!isNaN(idFromQuery)) return idFromQuery;

    
    const idFromToken = req.user?.id || req.user?.sub;
    const parsedTokenId = parseInt(idFromToken, 10);
    
    if (isNaN(parsedTokenId)) {
      throw new BadRequestException('Nem azonosítható felhasználó (userId missing or NaN)');
    }
    return parsedTokenId;
  }

  @Roles(Role.ADMIN)
  @Post('sort-warehouse')
  sortWarehouse(@Request() req, @Query('userId') userId?: string) {
    return this.batchService.sortWarehouse(this.getUserId(req, userId));
  }

  @Roles(Role.KEZELO, Role.ADMIN)
  @Post()
  create(@Body() createBatchDto: CreateBatchDto, @Request() req, @Query('userId') userId?: string) {
    return this.batchService.create(createBatchDto, this.getUserId(req, userId));
  }

  @Roles(Role.KEZELO, Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateBatchDto: UpdateBatchDto, 
    @Request() req,
    @Query('userId') userId?: string
  ) {
    return this.batchService.update(id, updateBatchDto, this.getUserId(req, userId));
  }

  @Roles(Role.KEZELO, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req, @Query('userId') userId?: string) {
    return this.batchService.remove(id, this.getUserId(req, userId));
  }
}
