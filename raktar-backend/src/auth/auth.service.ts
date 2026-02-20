//raktar-backend/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../user/entities/user.entity';
import { PrismaService } from '../prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ForceChangePasswordDto } from './dto/force-change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService, // Injektáljuk a Prismát a közvetlen frissítésekhez
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
      rang: user.rang,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: new UserEntity(user),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userService.findByUsername(dto.felhasznalonev);

    // Normalizáljuk a telefonszámokat: kiszedjük az összes szóközt az összehasonlításhoz
    const dbPhone = user?.telefonszam ? user.telefonszam.replace(/\s+/g, '') : '';
    const inputPhone = dto.telefonszam ? dto.telefonszam.replace(/\s+/g, '') : '';

    // Biztonsági okokból nem áruljuk el pontosan, melyik adat hibás (ne lehessen tippelgetni)
    if (!user || user.email !== dto.email || dbPhone !== inputPhone) {
      throw new UnauthorizedException('A megadott adatok nem egyeznek a nyilvántartásunkkal!');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Ez a fiók fel van függesztve!');
    }

    // Ideiglenes jelszó generálása (8 karakter, random)
    const tempPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Adatbázis frissítése
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        jelszo: hashedPassword,
        mustChangePassword: true, // Bekapcsoljuk a kényszerített cserét
      },
    });

    // Mivel nincs email szerver, visszatérünk a jelszóval, amit a kliens megmutat
    return { 
      message: 'Sikeres azonosítás!',
      tempPassword: tempPassword 
    };
  }

  async forceChangePassword(dto: ForceChangePasswordDto) {
    const user = await this.userService.findByUsername(dto.felhasznalonev);

    if (!user) {
      throw new UnauthorizedException('Hibás felhasználónév!');
    }

    // Ha a usernek nem is kell jelszót cserélnie, de hívja a végpontot
    if (!user.mustChangePassword) {
      throw new BadRequestException('Ennek a fióknak nincs függőben lévő jelszócseréje!');
    }

    const isMatch = await bcrypt.compare(dto.ideiglenesJelszo, user.jelszo);
    if (!isMatch) {
      throw new UnauthorizedException('Az ideiglenes jelszó hibás!');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(dto.ujJelszo, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        jelszo: hashedNewPassword,
        mustChangePassword: false, // Flag levétele
      },
    });

    return { message: 'A jelszó sikeresen frissítve! Kérjük, jelentkezzen be az új jelszavával.' };
  }
}
