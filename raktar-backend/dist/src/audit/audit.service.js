"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const { userId, targetUserId, isAdmin, muvelet, stockId, startDate, endDate } = query;
        const where = {};
        if (!isAdmin) {
            where.userId = userId;
        }
        else if (targetUserId) {
            where.userId = Number(targetUserId);
        }
        if (muvelet) {
            where.muvelet = muvelet;
        }
        if (stockId) {
            where.stockId = Number(stockId);
        }
        if (startDate || endDate) {
            where.idopont = {};
            if (startDate) {
                where.idopont.gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.idopont.lte = end;
            }
        }
        return this.prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { nev: true, felhasznalonev: true },
                },
                stock: {
                    select: { nev: true },
                },
            },
            orderBy: {
                idopont: 'desc',
            },
        });
    }
    async createLog(userId, muvelet, stockId, regiAdat, ujAdat) {
        return this.prisma.auditLog.create({
            data: {
                muvelet,
                userId,
                stockId,
                regiAdat: regiAdat ? JSON.parse(JSON.stringify(regiAdat)) : null,
                ujAdat: ujAdat ? JSON.parse(JSON.stringify(ujAdat)) : null,
            },
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map