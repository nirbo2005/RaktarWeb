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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('register')
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.userService.create(createUserDto);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('all')
  async findAll(): Promise<UserEntity[]> {
    return this.userService.findAll();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return this.userService.findOne(id);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Put('update-profile/:id')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateData: {
      felhasznalonev?: string;
      jelszo?: string;
      email?: string;
      telefonszam?: string;
      nev?: string;
    },
  ): Promise<UserEntity> {
    return this.userService.updateProfile(id, updateData);
  }

  @Post('request-change')
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
  async getPendingRequests() {
    return this.userService.getPendingRequests();
  }

  @Patch('admin/handle-request/:requestId')
  async handleRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() body: { statusz: 'APPROVED' | 'REJECTED' },
  ) {
    return this.userService.handleRequest(requestId, body.statusz);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('admin/toggle-ban/:id')
  async toggleBan(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return this.userService.toggleBan(id);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Delete('admin/delete/:id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<UserEntity> {
    return this.userService.remove(id);
  }
}
