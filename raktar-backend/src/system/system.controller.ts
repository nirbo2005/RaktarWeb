// raktar-backend/src/system/system.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from '../app.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  @Roles(Role.ADMIN)
  async getStatus() {
    return this.appService.getSystemStatus();
  }
}
