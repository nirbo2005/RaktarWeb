import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(createUserDto: CreateUserDto): Promise<{
        id: number;
        nev: string;
        felhasznalonev: string;
        email: string | null;
        telefonszam: string | null;
        admin: boolean;
    }>;
    findAll(): Promise<{
        id: number;
        nev: string;
        felhasznalonev: string;
        email: string | null;
        telefonszam: string | null;
        admin: boolean;
        isBanned: boolean;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        nev: string;
        felhasznalonev: string;
        email: string | null;
        telefonszam: string | null;
        admin: boolean;
        isBanned: boolean;
    } | null>;
    updateProfile(id: number, updateData: {
        felhasznalonev?: string;
        jelszo?: string;
        email?: string;
        telefonszam?: string;
    }): Promise<{
        id: number;
        nev: string;
        felhasznalonev: string;
        email: string | null;
        telefonszam: string | null;
        admin: boolean;
        isBanned: boolean;
    }>;
    createRequest(body: {
        userId: number;
        tipus: string;
        ujErtek: string;
    }): Promise<{
        id: number;
        tipus: string;
        ujErtek: string;
        statusz: string;
        letrehozva: Date;
        userId: number;
    }>;
    getPendingRequests(): Promise<({
        user: {
            nev: string;
            felhasznalonev: string;
        };
    } & {
        id: number;
        tipus: string;
        ujErtek: string;
        statusz: string;
        letrehozva: Date;
        userId: number;
    })[]>;
    handleRequest(requestId: number, body: {
        statusz: 'APPROVED' | 'REJECTED';
    }): Promise<{
        id: number;
        tipus: string;
        ujErtek: string;
        statusz: string;
        letrehozva: Date;
        userId: number;
    }>;
    toggleBan(id: number): Promise<{
        id: number;
        nev: string;
        felhasznalonev: string;
        email: string | null;
        jelszo: string;
        telefonszam: string | null;
        admin: boolean;
        isBanned: boolean;
    }>;
    remove(id: number): Promise<{
        id: number;
        nev: string;
        felhasznalonev: string;
        email: string | null;
        jelszo: string;
        telefonszam: string | null;
        admin: boolean;
        isBanned: boolean;
    }>;
}
