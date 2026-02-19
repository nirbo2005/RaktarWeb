import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; // ÚJ
import { JwtStrategy } from './jwt.strategy'; // ÚJ

@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), // ÚJ: Passport regisztrálása
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secretKey', // Ügyelj rá, hogy egyezzen a strategy-vel!
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // ÚJ: JwtStrategy hozzáadva a providerekhez
  exports: [AuthService],
})
export class AuthModule {}
