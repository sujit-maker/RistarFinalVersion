// src/permissions/permissions.decorator.ts
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

export const PERMISSION_KEY = 'permission';

export function RequirePermission(
  moduleName: string,
  action: 'canRead' | 'canCreate' | 'canEdit' | 'canDelete',
) {
  return applyDecorators(
    SetMetadata(PERMISSION_KEY, { moduleName, action }),
    UseGuards(JwtAuthGuard, PermissionsGuard), // 👈 Authenticate first, then check permissions
  );
}
