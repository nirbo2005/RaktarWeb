import { PrismaService } from 'src/prisma.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AuditService } from '../audit/audit.service';
export declare class StockService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }[]>;
    findOne(id: number, includeDeleted?: boolean): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }>;
    create(data: CreateStockDto, userId: number): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }>;
    update(id: number, data: Partial<UpdateStockDto>, userId: number): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }>;
    delete(id: number, userId: number): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }>;
    restore(id: number, userId: number): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }>;
    restoreFromLog(logId: number, userId: number): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }>;
}
