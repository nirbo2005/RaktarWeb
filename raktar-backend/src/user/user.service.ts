import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { Role } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notification/notification.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    private notificationService: NotificationService,
  ) {}

  private normalizePhoneNumber(
    phone: string | null | undefined,
  ): string | null {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned ? `+${cleaned}` : null;
  }

  // Segédfüggvény a fizikai képfájl biztonságos törléséhez
  private deleteAvatarFile(avatarUrl: string | null) {
    if (!avatarUrl) return;
    try {
      const filename = path.basename(avatarUrl);
      const filePath = path.join(process.cwd(), 'uploads', 'avatars', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Hiba a profilkép fizikai törlésekor:', err);
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      const salt = await bcrypt.genSalt();
      const hashedJelszo = await bcrypt.hash(createUserDto.jelszo, salt);

      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          telefonszam: this.normalizePhoneNumber(createUserDto.telefonszam),
          jelszo: hashedJelszo,
          rang: createUserDto.rang || Role.NEZELODO,
        },
      });

      await this.notificationService.createAdminNotification(
        `Új felhasználó regisztrált: ${user.nev} (@${user.felhasznalonev})`,
        'INFO'
      );

      return new UserEntity(user);
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = JSON.stringify(error.meta?.target || '').toLowerCase();
        if (target.includes('felhasznalonev'))
          throw new ConflictException('Ez a felhasználónév már foglalt!');
        if (target.includes('email'))
          throw new ConflictException('Ez az e-mail cím már regisztrálva van!');
        if (target.includes('telefonszam') || target.includes('phone'))
          throw new ConflictException('Ez a telefonszám már használatban van!');
        throw new ConflictException(
          'Már létezik felhasználó ezekkel az adatokkal.',
        );
      }
      throw new InternalServerErrorException('Szerveroldali hiba történt.');
    }
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => new UserEntity(user));
  }

  async findByUsername(felhasznalonev: string) {
    return this.prisma.user.findUnique({ where: { felhasznalonev } });
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');
    return new UserEntity(user);
  }

  async updateProfile(id: number, data: any): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található!');

    const { ujJelszo, regiJelszo, telefonszam, ...validFields } = data;
    const updateData: any = { ...validFields };

    if (telefonszam !== undefined)
      updateData.telefonszam = this.normalizePhoneNumber(telefonszam);

    if (ujJelszo && ujJelszo.trim() !== '') {
      if (!regiJelszo) throw new BadRequestException('Régi jelszó kötelező!');
      const isMatch = await bcrypt.compare(regiJelszo, user.jelszo);
      if (!isMatch)
        throw new BadRequestException('A régi jelszó nem megfelelő!');
      
      const salt = await bcrypt.genSalt();
      updateData.jelszo = await bcrypt.hash(ujJelszo, salt);
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
      this.events.emitToUser(id, 'user_updated', updated);
      return new UserEntity(updated);
    } catch (error: any) {
      throw new InternalServerErrorException(
        'Szerveroldali hiba a profil frissítése közben.',
      );
    }
  }

  async updateAvatar(id: number, filename: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    const oldAvatar = user.avatarUrl;
    const newAvatarUrl = `/uploads/avatars/${filename}`;

    const updated = await this.prisma.user.update({
      where: { id },
      data: { avatarUrl: newAvatarUrl },
    });

    // Ha volt régi képe, töröljük a lemezről
    this.deleteAvatarFile(oldAvatar);

    this.events.emitToUser(id, 'user_updated', updated);
    return new UserEntity(updated);
  }

  async revokeAllSessions(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    await this.prisma.user.update({
      where: { id },
      data: { currentTokenVersion: { increment: 1 } },
    });

    this.events.emitToUser(id, 'force_logout', {
      userId: id,
      reason: 'security_reset',
    });
  }

  async createChangeRequest(userId: number, tipus: string, ujErtek: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const reqText = tipus === 'RANG_MODOSITAS' ? 'Jogosultság módosítás' : 'Név módosítás';

    await this.prisma.notification.deleteMany({
      where: {
        uzenet: {
          startsWith: `Új ${reqText} kérelem érkezett: ${user?.nev} (@${user?.felhasznalonev})`
        }
      }
    });

    await this.prisma.changeRequest.deleteMany({
      where: {
        userId: userId,
        tipus: tipus,
        statusz: 'PENDING',
      },
    });

    const request = await this.prisma.changeRequest.create({
      data: { userId, tipus, ujErtek },
    });
    
    await this.notificationService.createAdminNotification(
      `Új ${reqText} kérelem érkezett: ${user?.nev} (@${user?.felhasznalonev}) -> ${ujErtek}`,
      'INFO'
    );

    this.events.emitUpdate('notifications_updated', { role: 'ADMIN' });
    return request;
  }

  async getPendingRequests() {
    return this.prisma.changeRequest.findMany({
      where: { statusz: 'PENDING' },
      include: { user: { select: { nev: true, felhasznalonev: true } } },
    });
  }

  async getUserPendingRequests(userId: number) {
    return this.prisma.changeRequest.findMany({
      where: { userId: userId, statusz: 'PENDING' },
      include: { user: { select: { nev: true, felhasznalonev: true } } },
    });
  }

  async handleRequest(requestId: number, statusz: 'APPROVED' | 'REJECTED') {
    const request = await this.prisma.changeRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });
    if (!request) throw new NotFoundException('Kérelem nem található');

    let updatedUser: any = null;
    let notifType = statusz === 'APPROVED' ? 'INFO' : 'WARNING';
    let reqText = request.tipus === 'RANG_MODOSITAS' ? 'jogosultság' : 'név';

    if (statusz === 'APPROVED') {
      if (request.tipus === 'NEV_MODOSITAS') {
        updatedUser = await this.prisma.user.update({
          where: { id: request.userId },
          data: { nev: request.ujErtek },
        });
      } else if (request.tipus === 'RANG_MODOSITAS') {
        updatedUser = await this.prisma.user.update({
          where: { id: request.userId },
          data: { 
            rang: request.ujErtek as Role,
            currentTokenVersion: { increment: 1 }
          },
        });
      }

      await this.notificationService.createTargetedNotification(
        request.userId,
        `A(z) ${reqText} módosítási kérelmedet ELFOGADTÁK. Új érték: ${request.ujErtek}`,
        notifType
      );

      if (updatedUser) {
        if (request.tipus === 'RANG_MODOSITAS') {
          this.events.emitToUser(request.userId, 'force_logout', {
            userId: request.userId,
            reason: 'session_expired',
          });
        } else {
          this.events.emitToUser(request.userId, 'user_updated', updatedUser);
        }
      }
    } else {
      await this.notificationService.createTargetedNotification(
        request.userId,
        `A(z) ${reqText} módosítási kérelmedet ELUTASÍTOTTÁK.`,
        notifType
      );
    }

    const updatedRequest = await this.prisma.changeRequest.update({
      where: { id: requestId },
      data: { statusz },
    });
    
    this.events.emitToUser(request.userId, 'notifications_updated', {
      userId: request.userId,
    });
    return updatedRequest;
  }

  async toggleBan(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isBanned: !user.isBanned,
        currentTokenVersion: { increment: 1 },
      },
    });

    if (updated.isBanned) {
      await this.notificationService.createAdminNotification(`Felhasználó kitiltva: ${updated.nev} (@${updated.felhasznalonev})`, 'WARNING');
      this.events.emitToUser(id, 'force_logout', {
        userId: id,
        reason: 'banned',
      });
    } else {
      await this.notificationService.createAdminNotification(`Felhasználó kitiltása feloldva: ${updated.nev} (@${updated.felhasznalonev})`, 'INFO');
      this.events.emitToUser(id, 'user_updated', updated);
    }

    return new UserEntity(updated);
  }

  async remove(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');
    
    const oldAvatar = user.avatarUrl;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        nev: 'Törölt felhasználó',
        felhasznalonev: `torolt_${id}_${Math.floor(Math.random() * 1000)}`,
        email: `deleted_${id}@raktar.local`,
        telefonszam: '---',
        avatarUrl: null, // Töröljük a képre mutató hivatkozást
        isBanned: true,
        currentTokenVersion: { increment: 1 },
      },
    });

    // Ha volt képe, azt a szerverről is töröljük
    this.deleteAvatarFile(oldAvatar);

    if (user) {
       await this.notificationService.createAdminNotification(
         `Profil törölve: ${user.nev} (@${user.felhasznalonev}) fiókja megsemmisült.`,
         'ERROR'
       );
    }

    this.events.emitToUser(id, 'force_logout', {
      userId: id,
      reason: 'banned',
    });
    return new UserEntity(updated);
  }
}
