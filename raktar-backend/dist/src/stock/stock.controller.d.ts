import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    getAll(): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }[]>;
    getOne(id: number, admin?: string): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }>;
    create(body: CreateStockDto & {
        userId: number;
    }): Promise<{
        id: number;
        nev: string;
        gyarto: string;
        lejarat: Date;
        ar: number;
        mennyiseg: number;
        parcella: string;
        isDeleted: boolean;
    }>;
    update(id: number, body: UpdateStockDto & {
        userId: number;
    }): Promise<{
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
