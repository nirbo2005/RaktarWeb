//raktar-backend/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(felhasznalonev: string, jelszo: string) {
    const user = await this.userService.findByUsername(felhasznalonev);

    if (!user) {
      throw new UnauthorizedException('Hibás felhasználónév vagy jelszó!');
    }

    if (user.isBanned) {
      throw new ForbiddenException(
        'A fiókodat felfüggesztettük. Kérjük, fordulj az adminisztrátorhoz!',
      );
    }

    const isMatch = await bcrypt.compare(jelszo, user.jelszo);

    if (!isMatch) {
      throw new UnauthorizedException('Hibás felhasználónév vagy jelszó!');
    }

    const payload = {
      sub: user.id,
      username: user.felhasznalonev,
      admin: user.admin,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: new UserEntity(user),
    };
  }
}
