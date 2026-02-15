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
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const audit_service_1 = require("../audit/audit.service");
let StockService = class StockService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll() {
        return this.prisma.stock.findMany({
            where: { isDeleted: false }
        });
    }
    async findOne(id, includeDeleted = false) {
        const stock = await this.prisma.stock.findFirst({
            where: includeDeleted ? { id } : { id, isDeleted: false },
        });
        if (!stock)
            throw new common_1.NotFoundException(`Termék nem található!`);
        return stock;
    }
    async create(data, userId) {
        const newStock = await this.prisma.stock.create({
            data: { ...data, isDeleted: false },
        });
        await this.audit.createLog(userId, 'CREATE', newStock.id, null, newStock);
        return newStock;
    }
    async update(id, data, userId) {
        const oldData = await this.findOne(id);
        const updated = await this.prisma.stock.update({
            where: { id: Number(id) },
            data: data,
        });
        await this.audit.createLog(userId, 'UPDATE', id, oldData, updated);
        return updated;
    }
    async delete(id, userId) {
        const oldData = await this.findOne(id);
        const updated = await this.prisma.stock.update({
            where: { id: Number(id) },
            data: { isDeleted: true },
        });
        await this.audit.createLog(userId, 'DELETE', id, oldData, null);
        return updated;
    }
    async restore(id, userId) {
        const restored = await this.prisma.stock.update({
            where: { id: Number(id) },
            data: { isDeleted: false },
        });
        await this.audit.createLog(userId, 'RESTORE', id, { status: 'deleted' }, { status: 'active' });
        return restored;
    }
    async restoreFromLog(logId, userId) {
        const log = await this.prisma.auditLog.findUnique({
            where: { id: Number(logId) },
        });
        if (!log)
            throw new common_1.NotFoundException('Naplóbejegyzés nem található!');
        if (!log.stockId)
            throw new common_1.BadRequestException('Nincs kapcsolódó termék!');
        if (log.muvelet === 'DELETE') {
            return this.restore(log.stockId, userId);
        }
        if (log.muvelet === 'UPDATE' && log.regiAdat) {
            const restored = await this.prisma.stock.update({
                where: { id: log.stockId },
                data: log.regiAdat,
            });
            await this.audit.createLog(userId, 'RESTORE', log.stockId, log.ujAdat, log.regiAdat);
            return restored;
        }
        throw new common_1.BadRequestException('Ez a művelet nem vonható vissza!');
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], StockService);
//# sourceMappingURL=stock.service.js.map