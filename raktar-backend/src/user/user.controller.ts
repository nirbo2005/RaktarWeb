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
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('all')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Put('update-profile/:id')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    updateData: {
      felhasznalonev?: string;
      jelszo?: string;
      email?: string;
      telefonszam?: string;
    },
  ) {
    return this.userService.updateProfile(id, updateData);
  }

  @Post('request-change')
  createRequest(
    @Body() body: { userId: number; tipus: string; ujErtek: string },
  ) {
    return this.userService.createChangeRequest(
      body.userId,
      body.tipus,
      body.ujErtek,
    );
  }

  @Get('admin/pending-requests')
  getPendingRequests() {
    return this.userService.getPendingRequests();
  }

  @Patch('admin/handle-request/:requestId')
  handleRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() body: { statusz: 'APPROVED' | 'REJECTED' },
  ) {
    return this.userService.handleRequest(requestId, body.statusz);
  }

  @Patch('admin/toggle-ban/:id')
  toggleBan(@Param('id', ParseIntPipe) id: number) {
    return this.userService.toggleBan(id);
  }

  @Delete('admin/delete/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
