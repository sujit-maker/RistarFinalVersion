import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

async setPermission(data: any) {
  if (!data.userId || !data.module) {
    throw new Error("userId and module are required");
  }

  const existing = await this.prisma.permission.findFirst({
    where: { userId: data.userId, module: data.module },
  });

  if (existing) {
    return this.prisma.permission.update({
      where: { id: existing.id },
      data: {
        canCreate: data.canCreate,
        canRead: data.canRead,
        canEdit: data.canEdit,
        canDelete: data.canDelete
      },
    });
  }

  return this.prisma.permission.create({
    data: {
      userId: data.userId,
      module: data.module,
      canCreate: data.canCreate,
      canRead: data.canRead,
      canEdit: data.canEdit,
      canDelete: data.canDelete
    },
  });
}


async getPermissions(userId: number) {
    return this.prisma.permission.findMany({
      where: { userId },
    });
  }
  
async getPermissionsByUser(userId: number, module: string) {
  return this.prisma.permission.findFirst({
    where: { userId, module },
  });
}



}
