import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { PERMISSION_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector, private prisma: PrismaService) {
    super();
  }

// src/permissions/permissions.guard.ts
async canActivate(context: ExecutionContext): Promise<boolean> {
  const { moduleName, action } =
    this.reflector.get<{ moduleName: string; action: string }>(
      PERMISSION_KEY,
      context.getHandler(),
    ) || {};

  if (!moduleName || !action) {
    return true; // No permission required
  }

  const request = context.switchToHttp().getRequest();
  
  // Take userId from query or body
  const userId = Number(request.query?.userId || request.body?.userId);
  
  if (!userId) {
    throw new ForbiddenException('No userId provided');
  }

  const permission = await this.prisma.permission.findFirst({
    where: { userId, module: moduleName },
  });

  if (!permission || !permission[action]) {
    throw new ForbiddenException(`No ${action} permission for ${moduleName}`);
  }

  return true;
}


}
