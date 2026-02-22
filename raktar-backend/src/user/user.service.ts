import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { Role } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const salt = await bcrypt.genSalt();
    const hashedJelszo = await bcrypt.hash(createUserDto.jelszo, salt);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        jelszo: hashedJelszo,
        rang: createUserDto.rang || Role.NEZELODO,
      },
    });
    return new UserEntity(user);
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => new UserEntity(user));
  }

  async findByUsername(felhasznalonev: string) {
    return this.prisma.user.findUnique({
      where: { felhasznalonev },
    });
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException('Felhasználó nem található');
    
    
    return new UserEntity(user);
  }

  async updateProfile(id: number, data: any): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    const { ujJelszo, regiJelszo, ...validFields } = data;
    const updateData: any = { ...validFields };

    if (ujJelszo && ujJelszo.trim() !== '') {
      if (regiJelszo) {
        const isMatch = await bcrypt.compare(regiJelszo, user.jelszo);
        if (!isMatch)
          throw new UnauthorizedException('A régi jelszó nem megfelelő!');
      }

      const salt = await bcrypt.genSalt();
      updateData.jelszo = await bcrypt.hash(ujJelszo, salt);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    
    this.events.emitToUser(id, 'user_updated', updated);

    return new UserEntity(updated);
  }

  async createChangeRequest(userId: number, tipus: string, ujErtek: string) {
    const request = await this.prisma.changeRequest.create({
      data: { userId, tipus, ujErtek },
    });

    this.events.emitUpdate('notifications_updated', { role: 'ADMIN' });
    return request;
  }

  async getPendingRequests() {
    return this.prisma.changeRequest.findMany({
      where: { statusz: 'PENDING' },
      include: { user: { select: { nev: true, felhasznalonev: true } } },
    });
  }

  

  async handleRequest(requestId: number, statusz: 'APPROVED' | 'REJECTED') {
    const request = await this.prisma.changeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Kérelem nem található');

    
    let updatedUser: any = null;

    if (statusz === 'APPROVED') {
      if (request.tipus === 'NEV_MODOSITAS') {
        updatedUser = await this.prisma.user.update({
          where: { id: request.userId },
          data: { nev: request.ujErtek },
        });
      } else if (request.tipus === 'RANG_MODOSITAS') {
        updatedUser = await this.prisma.user.update({
          where: { id: request.userId },
          data: { rang: request.ujErtek as Role },
        });
      }

      if (updatedUser) {
        
        this.events.emitToUser(request.userId, 'user_updated', updatedUser);
      }
    }

    const updatedRequest = await this.prisma.changeRequest.update({
      where: { id: requestId },
      data: { statusz },
    });

    
    this.events.emitToUser(request.userId, 'notifications_updated', { userId: request.userId });

    return updatedRequest;
  }



  async toggleBan(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isBanned: !user.isBanned },
    });

    if (updated.isBanned) {
      this.events.emitToUser(id, 'force_logout', {
        userId: id,
        reason: 'Fiók kitiltva',
      });
    } else {
      this.events.emitToUser(id, 'user_updated', updated);
    }

    return new UserEntity(updated);
  }

  async remove(id: number): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        nev: 'Törölt felhasználó',
        felhasznalonev: `torolt_${id}_${Math.floor(Math.random() * 1000)}`,
        email: `deleted_${id}@raktar.local`,
        telefonszam: '---',
        isBanned: true,
      },
    });

    this.events.emitToUser(id, 'force_logout', { userId: id, reason: 'Fiók törölve' });

    return new UserEntity(updated);
  }
}
