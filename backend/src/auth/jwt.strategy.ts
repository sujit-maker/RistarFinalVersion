// src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'fallback-secret-key-for-development',
    });
  }

  async validate(payload: any) {
    // we signed { sub, username, userType, email? }
    return {
      id: payload.sub,
      username: payload.username,
      userType: payload.userType,
      email: payload.email ?? null,
    };
  }
}
