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
  Request
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

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.userService.findAll();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAllAlias() {
    return this.userService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.userService.findOne(userId);
  }

  @Get('pending-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getPendingRequests() {
    return this.userService.getPendingRequests();
  }

  @Get(':id/pending-requests')
  @UseGuards(JwtAuthGuard)
  getUserPendingRequests(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserPendingRequests(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id/profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.userService.updateProfile(id, data);
  }

  @Patch(':id/preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { theme?: string; language?: string },
  ) {
    return this.userService.updatePreferences(id, data);
  }

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

  @Post('change-request')
  @UseGuards(JwtAuthGuard)
  createChangeRequest(@Body() body: { userId: number; tipus: string; ujErtek: string }) {
    return this.userService.createChangeRequest(body.userId, body.tipus, body.ujErtek);
  }

  @Post('handle-request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  handleRequest(@Body() body: { requestId: number; statusz: 'APPROVED' | 'REJECTED' }) {
    return this.userService.handleRequest(body.requestId, body.statusz);
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  toggleBan(@Param('id', ParseIntPipe) id: number) {
    return this.userService.toggleBan(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Post(':id/revoke-sessions')
  @UseGuards(JwtAuthGuard)
  async revokeSessions(@Param('id', ParseIntPipe) id: number) {
    return this.userService.revokeAllSessions(id);
  }
}
