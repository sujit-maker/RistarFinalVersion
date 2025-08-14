import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Post()
  setPermission(@Body() body) {
    return this.permissionsService.setPermission(body);
  }

   @Get()
  async getUserPermissions(@Query('userId') userId: string) {
    return this.permissionsService.getPermissions(Number(userId));
  }

   @Get()
  async getPermissions(@Query('userId') userId: string) {
    return this.permissionsService.getPermissions(Number(userId));
  }
}
