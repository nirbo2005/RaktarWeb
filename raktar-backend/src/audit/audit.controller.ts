import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { GetLogsQueryDto } from './dto/get-logs-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('audit')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized - Nincs bejelentkezve vagy érvénytelen token' })
@ApiResponse({ status: 403, description: 'Forbidden - Nincs megfelelő jogosultság' })
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: 'Audit napló (logok) lekérése szűrési feltételekkel' })
  @ApiResponse({ status: 200, description: 'Sikeres lekérdezés a rendszernaplóból' })
  @ApiParam({ name: 'userId', type: Number, description: 'A lekérdező felhasználó azonosítója' })
  @Get('user/:userId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @Roles(Role.NEZELODO, Role.KEZELO, Role.ADMIN)
  async getLogs(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: GetLogsQueryDto,
  ) {
    return this.auditService.findAll(userId, query);
  }
}