import { PrismaService } from '../prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: {
        userId?: number;
        targetUserId?: number;
        isAdmin: boolean;
        muvelet?: string;
        stockId?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<({
        stock: {
            nev: string;
        } | null;
        user: {
            nev: string;
            felhasznalonev: string;
        };
    } & {
        id: number;
        userId: number;
        muvelet: string;
        stockId: number | null;
        idopont: Date;
        regiAdat: import("@prisma/client/runtime/library").JsonValue | null;
        ujAdat: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    createLog(userId: number, muvelet: string, stockId?: number, regiAdat?: any, ujAdat?: any): Promise<{
        id: number;
        userId: number;
        muvelet: string;
        stockId: number | null;
        idopont: Date;
        regiAdat: import("@prisma/client/runtime/library").JsonValue | null;
        ujAdat: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
