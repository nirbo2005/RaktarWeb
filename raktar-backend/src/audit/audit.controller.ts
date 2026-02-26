//raktar-backend/src/audit/audit.controller.ts
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

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

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
