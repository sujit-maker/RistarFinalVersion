import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('actorId') actorId?: string,
    @Query('limit') limit: string = '50',
  ) {
    const where: any = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (actorId) where.actorId = actorId;

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { ts: 'desc' },
      take: parseInt(limit, 10),
    });

    return logs;
  }
}
