// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  // Optional server-side logout to create LOGOUT audit rows
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: any) {
    const u = req.user; // from JwtStrategy.validate()
    await this.prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        entity: 'Auth',
        entityId: String(u.id),
        actorId: String(u.id),
        actorEmail: u.email ?? u.username,
        actorRole: u.userType ?? null,
      },
    });
    return { message: 'Logged out' };
  }
}
