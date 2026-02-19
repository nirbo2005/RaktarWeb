//raktar-backend/src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey', // Ügyelj rá, hogy ez egyezzen az AuthModule-lal
    });
  }

  async validate(payload: any) {
    // Ez kerül be a request.user objektumba
    return { 
      id: payload.sub, 
      username: payload.username, 
      rang: payload.rang 
    };
  }
}
