//raktar-backend/src/audit/audit.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { GetLogsQueryDto } from './dto/get-logs-query.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('user/:userId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getLogs(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: GetLogsQueryDto,
  ) {
    return this.auditService.findAll(userId, query);
  }
}
