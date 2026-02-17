import { Controller, Get, Post, Body, Param, Put, Delete, Patch, Query, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // REGISZTRÁCIÓ
  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // ÖSSZES FELHASZNÁLÓ (Admin felülethez)
  @Get('all')
  findAll() {
    return this.userService.findAll();
  }

  // EGY FELHASZNÁLÓ ADATAI
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  // PROFIL ADATOK MÓDOSÍTÁSA (User által közvetlenül)
  @Put('update-profile/:id')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: { felhasznalonev?: string; jelszo?: string; email?: string; telefonszam?: string }
  ) {
    return this.userService.updateProfile(id, updateData);
  }

  // KÉRELEM BENYÚJTÁSA (Név vagy Admin státusz)
  @Post('request-change')
  createRequest(
    @Body() body: { userId: number; tipus: string; ujErtek: string }
  ) {
    return this.userService.createChangeRequest(body.userId, body.tipus, body.ujErtek);
  }

  // FÜGGŐBEN LÉVŐ KÉRELMEK LISTÁZÁSA (Adminnak)
  @Get('admin/pending-requests')
  getPendingRequests() {
    return this.userService.getPendingRequests();
  }

  // KÉRELEM ELBÍRÁLÁSA (Admin)
  @Patch('admin/handle-request/:requestId')
  handleRequest(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() body: { statusz: 'APPROVED' | 'REJECTED' }
  ) {
    return this.userService.handleRequest(requestId, body.statusz);
  }

  // BANNOLÁS / FELOLDÁS (Admin)
  @Patch('admin/toggle-ban/:id')
  toggleBan(@Param('id', ParseIntPipe) id: number) {
    return this.userService.toggleBan(id);
  }

  // VÉGLEGES TÖRLÉS (Admin)
  @Delete('admin/delete/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
