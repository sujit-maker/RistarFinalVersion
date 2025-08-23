import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { requestContext } from '../request-context';

@Injectable()
export class ContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    const user = req.user
      ? {
          id: String(req.user.id ?? req.user.sub ?? ''),
          email: req.user.email,
          username: req.user.username,
          role: req.user.role ?? req.user.userType,
          userType: req.user.userType,
        }
      : undefined;

    const store = {
      requestId: randomUUID(),
      user,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    // Ensure the whole request pipeline (and Prisma) sees this context
    return requestContext.run(store, () => next.handle());
  }
}
