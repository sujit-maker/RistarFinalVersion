// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs'; // ← use bcryptjs (install as noted)

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    // Find by username (adjust if you authenticate via email)
    const user = await this.prisma.user.findUnique({ where: { username } });

    if (!user) {
      // LOGIN_FAILURE (user not found)
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILURE',
          entity: 'Auth',
          entityId: null,
          actorId: null,
          actorEmail: username, 
          actorRole: null,
          meta: { reason: 'USER_NOT_FOUND' },
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare with the actual field in your schema (you have `password`, not `passwordHash`)
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      // LOGIN_FAILURE (bad password)
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILURE',
          entity: 'Auth',
          entityId: String(user.id),
          actorId: String(user.id),
          actorEmail: user.email ?? user.username,
          actorRole: user.userType ?? null, // no `role` field in your user
          meta: { reason: 'BAD_PASSWORD' },
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Success → sign JWT
    const payload = {
      sub: String(user.id),              // JwtStrategy.validate expects `sub`
      username: user.username,
      userType: user.userType ?? null,   // keep your current shape
      // (add email if you want it available in req.user)
      email: user.email ?? null,
    };
    const access_token = await this.jwt.signAsync(payload);

    // LOGIN_SUCCESS
    await this.prisma.auditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        entity: 'Auth',
        entityId: String(user.id),
        actorId: String(user.id),
        actorEmail: user.email ?? user.username,
        actorRole: user.userType ?? null,
      },
    });

    return {
      access_token,
      userId: user.id,
      userType: user.userType,
      message: 'OK',
    };
  }
}
