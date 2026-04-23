import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from '../app.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('system')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized - Nincs bejelentkezve vagy érvénytelen token' })
@ApiResponse({ status: 403, description: 'Forbidden - Nincs megfelelő jogosultság' })
@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Szerver és adatbázis rendszerállapotának lekérése' })
  @ApiResponse({ status: 200, description: 'Sikeres lekérdezés a rendszer erőforrásairól és állapotáról' })
  @Get('status')
  @Roles(Role.ADMIN)
  async getStatus() {
    return this.appService.getSystemStatus();
  }
}