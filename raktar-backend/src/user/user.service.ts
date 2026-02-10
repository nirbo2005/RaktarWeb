import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    const hashedJelszo = await bcrypt.hash(createUserDto.jelszo, salt);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        jelszo: hashedJelszo,
        admin: createUserDto.admin ?? false,
      },
      select: {
        id: true,
        nev: true,
        felhasznalonev: true,
        email: true,
        telefonszam: true,
        admin: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nev: true,
        felhasznalonev: true,
        email: true,
        telefonszam: true,
        admin: true,
        isBanned: true,
      },
    });
  }
  
  async findByUsername(felhasznalonev: string) {
    return this.prisma.user.findUnique({
      where: { felhasznalonev },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        nev: true, 
        felhasznalonev: true, 
        email: true, 
        telefonszam: true, 
        admin: true, 
        isBanned: true 
      },
    });
  }

  /**
   * PROFIL MÓDOSÍTÁSA (Kezeli a saját profil és az adminisztrátori szerkesztés logikáját is)
   */
  async updateProfile(id: number, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    // 1. Prisma-idegen mezők kiszűrése (ujJelszo, regiJelszo eltávolítása a data-ból)
    const { ujJelszo, regiJelszo, ...validFields } = data;
    const updateData: any = { ...validFields };

    // 2. JELSZÓ MÓDOSÍTÁS LOGIKÁJA
    if (ujJelszo && ujJelszo.trim() !== "") {
      // Ha nem admin módosít (vagyis regiJelszo érkezett), ellenőrizzük a régit
      if (regiJelszo) {
        const isMatch = await bcrypt.compare(regiJelszo, user.jelszo);
        if (!isMatch) throw new UnauthorizedException('A régi jelszó nem megfelelő!');
      } 
      // Ha nincs regiJelszo, feltételezzük az adminisztrátori felülírást (AuthGuard védi az endpointot)
      
      const salt = await bcrypt.genSalt();
      updateData.jelszo = await bcrypt.hash(ujJelszo, salt);
    }

    // 3. ADATBÁZIS FRISSÍTÉSE
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nev: true,
        felhasznalonev: true,
        email: true,
        telefonszam: true,
        admin: true,
        isBanned: true
      }
    });
  }

  async createChangeRequest(userId: number, tipus: string, ujErtek: string) {
    return this.prisma.changeRequest.create({
      data: {
        userId,
        tipus,
        ujErtek,
      },
    });
  }

  async getPendingRequests() {
    return this.prisma.changeRequest.findMany({
      where: { statusz: 'PENDING' },
      include: { user: { select: { nev: true, felhasznalonev: true } } },
    });
  }

  async handleRequest(requestId: number, statusz: 'APPROVED' | 'REJECTED') {
    const request = await this.prisma.changeRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Kérelem nem található');

    if (statusz === 'APPROVED') {
      if (request.tipus === 'NEV_MODOSITAS') {
        await this.prisma.user.update({
          where: { id: request.userId },
          data: { nev: request.ujErtek },
        });
      } else if (request.tipus === 'ADMIN_KERELEM') {
        await this.prisma.user.update({
          where: { id: request.userId },
          data: { admin: request.ujErtek === 'true' },
        });
      }
    }

    return this.prisma.changeRequest.update({
      where: { id: requestId },
      data: { statusz },
    });
  }

  async toggleBan(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    return this.prisma.user.update({
      where: { id },
      data: { isBanned: !user.isBanned },
    });
  }

  async remove(id: number) { 
    return this.prisma.user.delete({ where: { id } });
  }
}
