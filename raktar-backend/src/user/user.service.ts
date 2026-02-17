//raktar-backend/src/user/user.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const salt = await bcrypt.genSalt();
    const hashedJelszo = await bcrypt.hash(createUserDto.jelszo, salt);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        jelszo: hashedJelszo,
        admin: createUserDto.admin ?? false,
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
    return new UserEntity(updated);
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
    const request = await this.prisma.changeRequest.findUnique({
      where: { id: requestId },
    });
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

  async toggleBan(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Felhasználó nem található');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isBanned: !user.isBanned },
    });
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
    return new UserEntity(updated);
  }
}
