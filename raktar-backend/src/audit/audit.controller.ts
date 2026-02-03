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
  ) {
    return this.auditService.findAll(userId, admin);
  }
}
