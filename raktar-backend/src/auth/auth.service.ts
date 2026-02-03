import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async login(felhasznalonev: string, jelszo: string) {
    const user = await this.userService.findByUsername(felhasznalonev);
    
    if (!user) {
      throw new UnauthorizedException('Hibás felhasználónév vagy jelszó!');
    }

    const isMatch = await bcrypt.compare(jelszo, user.jelszo);

    if (!isMatch) {
      throw new UnauthorizedException('Hibás felhasználónév vagy jelszó!');
    }
    const payload = { sub: user.id, username: user.felhasznalonev, admin: user.admin };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        nev: user.nev,
        felhasznalonev: user.felhasznalonev,
        admin: user.admin
      }
    };
  }
}
