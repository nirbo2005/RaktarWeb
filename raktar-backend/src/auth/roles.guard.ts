//raktár-backend/src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Ha nincs megadva role a végponton, akkor bárki (bejelentkezett) beléphet
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Ellenőrizzük, hogy a user rangja benne van-e az engedélyezett rangok listájában
    const hasRole = requiredRoles.some((role) => user?.rang === role);

    if (!hasRole) {
      throw new ForbiddenException('Nincs jogosultságod a művelet végrehajtásához!');
    }

    return hasRole;
  }
}
