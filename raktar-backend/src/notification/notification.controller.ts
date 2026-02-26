// raktar-backend/src/notification/notification.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  private getUserId(req: any): number {
    const id = req.user?.id || req.user?.userId || req.user?.sub;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      throw new BadRequestException(
        'Nem azonosítható felhasználó (Notification)',
      );
    }
    return parsedId;
  }

  @Get()
  getMyNotifications(@Request() req: any) {
    return this.notificationService.getMyNotifications(this.getUserId(req));
  }

  @Patch('read-all')
  markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(this.getUserId(req));
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.notificationService.markAsRead(id, this.getUserId(req));
  }

  @Delete('read')
  deleteRead(@Request() req: any) {
    return this.notificationService.deleteReadNotifications(
      this.getUserId(req),
    );
  }
}
