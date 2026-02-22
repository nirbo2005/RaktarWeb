import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ForceChangePasswordDto } from './dto/force-change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({ 
      where: { felhasznalonev: loginDto.felhasznalonev } 
    });

    if (!user || !(await bcrypt.compare(loginDto.jelszo, user.jelszo))) {
      throw new UnauthorizedException('Hibás felhasználónév vagy jelszó!');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Ez a fiók fel van függesztve!');
    }

    
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { currentTokenVersion: { increment: 1 } }
    });
  
    
    const payload = { 
      username: updatedUser.felhasznalonev, 
      sub: updatedUser.id, 
      rang: updatedUser.rang,
      version: updatedUser.currentTokenVersion,
      mustChangePassword: updatedUser.mustChangePassword 
    };
  
    
    this.events.emitToUser(updatedUser.id, 'force_logout', { 
      userId: updatedUser.id,
      reason: 'Új bejelentkezés történt egy másik eszközről.' 
    });
  
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: updatedUser.id,
        nev: updatedUser.nev, 
        felhasznalonev: updatedUser.felhasznalonev,
        email: updatedUser.email,
        telefonszam: updatedUser.telefonszam,
        rang: updatedUser.rang,
        mustChangePassword: updatedUser.mustChangePassword
      }
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userService.findByUsername(dto.felhasznalonev);

    const dbPhone = user?.telefonszam ? user.telefonszam.replace(/\s+/g, '') : '';
    const inputPhone = dto.telefonszam ? dto.telefonszam.replace(/\s+/g, '') : '';

    if (!user || user.email !== dto.email || dbPhone !== inputPhone) {
      throw new UnauthorizedException('A megadott adatok nem egyeznek!');
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedTemp = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        jelszo: hashedTemp,
        mustChangePassword: true,
        currentTokenVersion: { increment: 1 }
      }
    });

    this.events.emitToUser(user.id, 'force_logout', { 
      userId: user.id,
      reason: 'Adminisztrátori jelszó-reset történt.' 
    });

    return { 
      message: 'Ideiglenes jelszó generálva.',
      tempPassword 
    };
  }

  async forceChangePassword(dto: ForceChangePasswordDto) {
    const user = await this.userService.findByUsername(dto.felhasznalonev);
    if (!user) throw new UnauthorizedException('Felhasználó nem található!');

    const isMatch = await bcrypt.compare(dto.ideiglenesJelszo, user.jelszo);
    if (!isMatch) throw new UnauthorizedException('Az ideiglenes jelszó hibás!');

    const hashedNew = await bcrypt.hash(dto.ujJelszo, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        jelszo: hashedNew,
        mustChangePassword: false,
        currentTokenVersion: { increment: 1 }
      }
    });

    this.events.emitToUser(user.id, 'force_logout', { 
      userId: user.id,
      reason: 'Sikeres jelszóváltás. Kérjük jelentkezzen be újra!' 
    });

    return { message: 'Sikeres jelszóváltás!' };
  }
}
