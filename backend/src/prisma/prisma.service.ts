import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getRequestContext } from '../common/request-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['warn', 'error'], // keep your existing logs
    });
  }

  async onModuleInit() {
    await this.$connect();

    // ---- Audit middleware ----
    this.$use(async (params, next) => {
      // never log audit writes to avoid recursion
      if (params.model === 'AuditLog') return next(params);

      const mutating = new Set([
        'create',
        'createMany',
        'update',
        'updateMany',
        'upsert',
        'delete',
        'deleteMany',
      ]);
      if (!mutating.has(params.action)) return next(params);

      const ctx = getRequestContext();
      const entity = params.model!;
      const args: any = params.args ?? {};
      const where = args.where;

      // Try to infer entityId from where.id (best-effort)
      let entityId: string | undefined =
        where?.id && typeof where.id !== 'object' ? String(where.id) : undefined;

      // Fetch old values for update/delete/upsert
      let oldValues: any;
      if ((params.action === 'update' || params.action === 'delete' || params.action === 'upsert') && where) {
        try {
          oldValues = await (this as any)[entity].findFirst({ where });
        } catch {
          // ignore
        }
      }

      // Capture new values for create/update/upsert
      let newValues: any =
        params.action === 'create' || params.action === 'update' || params.action === 'upsert'
          ? args.data
          : undefined;

      // Proceed with the actual operation
      const result = await next(params);

      // If result has id (create/upsert), prefer that
      if (!entityId && result && typeof result === 'object' && 'id' in result) {
        try {
          entityId = String((result as any).id);
        } catch {}
      }

      // Strip secrets from snapshots
      const sanitize = (obj: any) => {
        const banned = new Set(['password', 'passwordHash', 'refreshToken', 'secretKey', 'otp']);
        if (!obj || typeof obj !== 'object') return obj;
        const out: any = Array.isArray(obj) ? [] : {};
        for (const k of Object.keys(obj)) {
          if (banned.has(k)) continue;
          const v = obj[k];
          out[k] = typeof v === 'object' ? sanitize(v) : v;
        }
        return out;
      };

      const action =
        params.action === 'create' ? 'CREATE' :
        params.action === 'createMany' ? 'CREATE' :
        params.action === 'update' ? 'UPDATE' :
        params.action === 'updateMany' ? 'BULK_UPDATE' :
        params.action === 'upsert' ? 'UPSERT' :
        params.action === 'delete' ? 'DELETE' :
        params.action === 'deleteMany' ? 'BULK_DELETE' : 'UPDATE';

      // Best-effort; never block main transaction if logging fails
      try {
        await (this as any).auditLog.create({
          data: {
            requestId: ctx?.requestId,
            actorId: ctx?.user?.id,
            actorEmail: ctx?.user?.email ?? ctx?.user?.username ?? undefined,
            actorRole: ctx?.user?.role ?? ctx?.user?.userType ?? undefined,
            action,
            entity,
            entityId,
            oldValues: sanitize(oldValues),
            newValues: sanitize(newValues),
            ip: ctx?.ip,
            userAgent: ctx?.userAgent,
            meta: params.action.endsWith('Many') ? { filters: args.where ?? null } : undefined,
          },
        });
      } catch {
        // swallow
      }

      return result;
    });
  }

  async enableShutdownHooks(app: INestApplication) {
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
