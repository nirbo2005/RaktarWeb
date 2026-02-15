import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getLogs(userId: number, admin: boolean, muvelet?: string, stockId?: string, targetUserId?: string, startDate?: string, endDate?: string): Promise<({
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
}
