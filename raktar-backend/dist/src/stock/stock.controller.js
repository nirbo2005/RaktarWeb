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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const stock_service_1 = require("./stock.service");
const swagger_1 = require("@nestjs/swagger");
let StockController = class StockController {
    stockService;
    constructor(stockService) {
        this.stockService = stockService;
    }
    async getAll() {
        return this.stockService.findAll();
    }
    async getOne(id, admin) {
        return this.stockService.findOne(id, admin === 'true');
    }
    async create(body) {
        const { userId, ...stockData } = body;
        return this.stockService.create(stockData, userId);
    }
    async update(id, body) {
        const { userId, ...stockData } = body;
        return this.stockService.update(id, stockData, userId);
    }
    async delete(id, userId) {
        return this.stockService.delete(id, userId);
    }
    async restore(id, userId) {
        return this.stockService.restore(id, userId);
    }
    async restoreFromLog(logId, userId) {
        return this.stockService.restoreFromLog(logId, userId);
    }
};
exports.StockController = StockController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Összes aktív termék lekérése' }),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StockController.prototype, "getAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Egy termék lekérése (adminoknak a törölteket is)' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('admin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "getOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Új termék létrehozása naplózással' }),
    (0, common_1.Post)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Termék módosítása naplózással' }),
    (0, common_1.Put)(':id'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true, transform: true })),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Termék puha törlése (Soft Delete)' }),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "delete", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Törölt termék visszaállítása ID alapján' }),
    (0, common_1.Patch)(':id/restore'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "restore", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Visszaállítás konkrét naplóbejegyzés alapján' }),
    (0, common_1.Post)('restore-log/:logId'),
    __param(0, (0, common_1.Param)('logId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "restoreFromLog", null);
exports.StockController = StockController = __decorate([
    (0, swagger_1.ApiTags)('stock'),
    (0, common_1.Controller)('stock'),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], StockController);
//# sourceMappingURL=stock.controller.js.map