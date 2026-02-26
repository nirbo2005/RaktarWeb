// raktar-backend/src/app.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getSystemStatus() {
    const start = Date.now();
    let databaseStatus = 'connected';
    let dbLatency = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - start;
    } catch (e) {
      databaseStatus = 'disconnected';
    }

    return {
      status: databaseStatus === 'connected' ? 'online' : 'degraded',
      database: databaseStatus,
      latency: `${dbLatency}ms`,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: new Date().toISOString(),
    };
  }
}
