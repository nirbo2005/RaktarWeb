//raktar-backend/src/auth/auth.controller.ts
import { Controller, Post, Body, UseInterceptors, ClassSerializerInterceptor, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ForceChangePasswordDto } from './dto/force-change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.felhasznalonev, loginDto.jelszo);
  }

  @Post('forgot-password')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('force-change-password')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async forceChangePassword(@Body() forceChangePasswordDto: ForceChangePasswordDto) {
    return this.authService.forceChangePassword(forceChangePasswordDto);
  }
}
