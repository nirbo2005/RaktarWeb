//raktar-backend/src/auth/jwt-auth.guard.ts
import {
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../user/user.controller';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const isChangePasswordRoute = request.url.includes('/user/change-password');

    if (user?.mustChangePassword && !isChangePasswordRoute) {
      throw new ForbiddenException({
        message: 'Jelszó megváltoztatása kötelező a folytatáshoz!',
        forcePasswordChange: true,
      });
    }

    return true;
  }
}
