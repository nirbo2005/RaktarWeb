import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service'; // Ellenőrizd az elérési utat!
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
        admin: true,
      }
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
      select: { id: true, nev: true, felhasznalonev: true, admin: true }
    });
  }
}
