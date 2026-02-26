//raktar-backend/src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        felhasznalonev: true,
        rang: true,
        currentTokenVersion: true,
        isBanned: true,
        mustChangePassword: true,
      },
    });

    if (!user || user.isBanned) {
      throw new UnauthorizedException(
        'Felhasználó nem található vagy tiltva van.',
      );
    }

    if (payload.version !== user.currentTokenVersion) {
      throw new UnauthorizedException(
        'Munkamenet lejárt (biztonsági okokból kiléptetve).',
      );
    }

    return {
      id: user.id,
      username: user.felhasznalonev,
      rang: user.rang,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
