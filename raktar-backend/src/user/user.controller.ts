// raktar-backend/src/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  SetMetadata,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('users')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized - Nincs bejelentkezve vagy érvénytelen token' })
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @ApiOperation({ summary: 'Új felhasználó regisztrációja' })
  @ApiResponse({ status: 201, description: 'Felhasználó sikeresen létrehozva' })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Összes felhasználó lekérése' })
  @ApiResponse({ status: 200, description: 'Sikeres lekérdezés' })
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.userService.findAll();
  }

  @ApiOperation({ summary: 'Összes felhasználó lekérése (Alias)' })
  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAllAlias() {
    return this.userService.findAll();
  }

  @ApiOperation({ summary: 'Bejelentkezett felhasználó adatainak lekérése' })
  @ApiResponse({ status: 200, description: 'Sikeres lekérdezés' })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.userService.findOne(userId);
  }

  @ApiOperation({ summary: 'Függőben lévő módosítási kérelmek lekérése (Admin)' })
  @Get('pending-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getPendingRequests() {
    return this.userService.getPendingRequests();
  }

  @ApiOperation({ summary: 'Felhasználó saját függőben lévő kérelmei' })
  @Get(':id/pending-requests')
  @UseGuards(JwtAuthGuard)
  getUserPendingRequests(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserPendingRequests(id);
  }

  @ApiOperation({ summary: 'Felhasználó lekérése ID alapján' })
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @ApiOperation({ summary: 'Felhasználói profil adatainak frissítése' })
  @ApiBody({ schema: { type: 'object', properties: { nev: { type: 'string' }, telefonszam: { type: 'string' }, regiJelszo: { type: 'string' }, ujJelszo: { type: 'string' } } } })
  @Patch(':id/profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.userService.updateProfile(id, data);
  }

  @ApiOperation({ summary: 'Felhasználói beállítások (téma, nyelv) mentése' })
  @ApiBody({ schema: { type: 'object', properties: { theme: { type: 'string' }, language: { type: 'string' } } } })
  @Patch(':id/preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { theme?: string; language?: string },
  ) {
    return this.userService.updatePreferences(id, data);
  }

  @ApiOperation({ summary: 'Profilkép feltöltése' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join(process.cwd(), 'uploads', 'avatars');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = extname(file.originalname) || '.jpg';
        cb(null, `avatar-${req.params.id}-${uniqueSuffix}${ext}`);
      }
    })
  }))
  uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nem érkezett fájl vagy nem megfelelő formátum!');
    }
    return this.userService.updateAvatar(id, file.filename);
  }

  @ApiOperation({ summary: 'Név vagy jogosultság módosítási kérelem beküldése' })
  @ApiBody({ schema: { type: 'object', properties: { userId: { type: 'number' }, tipus: { type: 'string' }, ujErtek: { type: 'string' } } } })
  @Post('change-request')
  @UseGuards(JwtAuthGuard)
  createChangeRequest(@Body() body: { userId: number; tipus: string; ujErtek: string }) {
    return this.userService.createChangeRequest(body.userId, body.tipus, body.ujErtek);
  }

  @ApiOperation({ summary: 'Módosítási kérelem elbírálása (Admin)' })
  @ApiBody({ schema: { type: 'object', properties: { requestId: { type: 'number' }, statusz: { type: 'string', enum: ['APPROVED', 'REJECTED'] } } } })
  @Post('handle-request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  handleRequest(@Body() body: { requestId: number; statusz: 'APPROVED' | 'REJECTED' }) {
    return this.userService.handleRequest(body.requestId, body.statusz);
  }

  @ApiOperation({ summary: 'Felhasználó kitiltása vagy visszaállítása' })
  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggleBan(@Param('id', ParseIntPipe) id: number) {
    return this.userService.toggleBan(id);
  }

  @ApiOperation({ summary: 'Felhasználó (soft) törlése' })
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @ApiOperation({ summary: 'Felhasználó összes munkamenetének megszakítása' })
  @Post(':id/revoke-sessions')
  @UseGuards(JwtAuthGuard)
  async revokeSessions(@Param('id', ParseIntPipe) id: number) {
    return this.userService.revokeAllSessions(id);
  }
}