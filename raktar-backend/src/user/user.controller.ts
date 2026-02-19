//raktar-backend/src/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

// Segéd-dekorátor a publikus végpontokhoz
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public() // Ez feloldja a JwtAuthGuard szigorítását
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('register')
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.userService.create(createUserDto);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('all')
  @Roles(Role.ADMIN)
  async findAll(): Promise<UserEntity[]> {
    return this.userService.findAll();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  @Roles(Role.NEZELODO, Role.KEZELO, Role.ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return this.userService.findOne(id);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Put('update-profile/:id')
  @Roles(Role.NEZELODO, Role.KEZELO, Role.ADMIN)
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
  ): Promise<UserEntity> {
    return this.userService.updateProfile(id, updateData);
  }

  @Post('request-change')
  @Roles(Role.NEZELODO, Role.KEZELO, Role.ADMIN)
  async createRequest(
    @Body() body: { userId: number; tipus: string; ujErtek: string },
  ) {
    return this.userService.createChangeRequest(
      body.userId,
      body.tipus,
      body.ujErtek,
    );
  }

  @Get('admin/pending-requests')
  @Roles(Role.ADMIN)
  async getPendingRequests() {
    return this.userService.getPendingRequests();
  }

  @Patch('admin/handle-request/:requestId')
  @Roles(Role.ADMIN)
  async handleRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() body: { statusz: 'APPROVED' | 'REJECTED' },
  ) {
    return this.userService.handleRequest(requestId, body.statusz);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('admin/toggle-ban/:id')
  @Roles(Role.ADMIN)
  async toggleBan(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return this.userService.toggleBan(id);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete('admin/delete/:id')
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return this.userService.remove(id);
  }
}
