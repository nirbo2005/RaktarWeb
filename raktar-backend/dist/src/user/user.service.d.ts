import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma.service';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findByUsername(felhasznalonev: string): Promise<{
        id: number;
        nev: string;
        felhasznalonev: string;
        email: string | null;
        jelszo: string;
        telefonszam: string | null;
        admin: boolean;
        isBanned: boolean;
    } | null>;
    findOne(id: number): Promise<{
        id: number;
        nev: string;
        felhasznalonev: string;
        email: string | null;
        telefonszam: string | null;
        admin: boolean;
        isBanned: boolean;
    } | null>;
    updateProfile(id: number, data: any): Promise<{
        id: number;
        nev: string;
        felhasznalonev: string;
        email: string | null;
        telefonszam: string | null;
        admin: boolean;
        isBanned: boolean;
    }>;
    createChangeRequest(userId: number, tipus: string, ujErtek: string): Promise<{
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
    handleRequest(requestId: number, statusz: 'APPROVED' | 'REJECTED'): Promise<{
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
