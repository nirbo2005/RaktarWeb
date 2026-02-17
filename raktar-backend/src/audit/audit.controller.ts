//raktar-backend/src/audit/audit.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('user/:userId')
  async getLogs(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('admin', ParseBoolPipe) admin: boolean,
    @Query('muvelet') muvelet?: string,
    @Query('stockId') stockId?: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.findAll({
      userId,
      isAdmin: admin,
      muvelet,
      stockId: stockId ? +stockId : undefined,
      targetUserId: targetUserId ? +targetUserId : undefined,
      startDate,
      endDate,
    });
  }
}
