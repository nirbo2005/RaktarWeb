import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private userService;
    private jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    login(felhasznalonev: string, jelszo: string): Promise<{
        access_token: string;
        user: {
            id: number;
            nev: string;
            felhasznalonev: string;
            email: string | null;
            telefonszam: string | null;
            admin: boolean;
        };
    }>;
}
