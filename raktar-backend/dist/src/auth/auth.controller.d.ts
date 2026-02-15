import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        felhasznalonev: string;
        jelszo: string;
    }): Promise<{
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
