import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionsGuard } from 'src/permissions/permissions.guard';

@Module({
  imports:[PrismaModule],
  controllers: [QuotationController],
  providers: [QuotationService,PermissionsGuard]
})
export class QuotationModule {}
