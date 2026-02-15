"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcrypt"));
let UserService = class UserService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createUserDto) {
        const salt = await bcrypt.genSalt();
        const hashedJelszo = await bcrypt.hash(createUserDto.jelszo, salt);
        return this.prisma.user.create({
            data: {
                ...createUserDto,
                jelszo: hashedJelszo,
                admin: createUserDto.admin ?? false,
            },
            select: {
                id: true,
                nev: true,
                felhasznalonev: true,
                email: true,
                telefonszam: true,
                admin: true,
            },
        });
    }
    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                nev: true,
                felhasznalonev: true,
                email: true,
                telefonszam: true,
                admin: true,
                isBanned: true,
            },
        });
    }
    async findByUsername(felhasznalonev) {
        return this.prisma.user.findUnique({
            where: { felhasznalonev },
        });
    }
    async findOne(id) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nev: true,
                felhasznalonev: true,
                email: true,
                telefonszam: true,
                admin: true,
                isBanned: true
            },
        });
    }
    async updateProfile(id, data) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Felhasználó nem található');
        const { ujJelszo, regiJelszo, ...validFields } = data;
        const updateData = { ...validFields };
        if (ujJelszo && ujJelszo.trim() !== "") {
            if (regiJelszo) {
                const isMatch = await bcrypt.compare(regiJelszo, user.jelszo);
                if (!isMatch)
                    throw new common_1.UnauthorizedException('A régi jelszó nem megfelelő!');
            }
            const salt = await bcrypt.genSalt();
            updateData.jelszo = await bcrypt.hash(ujJelszo, salt);
        }
        return this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                nev: true,
                felhasznalonev: true,
                email: true,
                telefonszam: true,
                admin: true,
                isBanned: true
            }
        });
    }
    async createChangeRequest(userId, tipus, ujErtek) {
        return this.prisma.changeRequest.create({
            data: {
                userId,
                tipus,
                ujErtek,
            },
        });
    }
    async getPendingRequests() {
        return this.prisma.changeRequest.findMany({
            where: { statusz: 'PENDING' },
            include: { user: { select: { nev: true, felhasznalonev: true } } },
        });
    }
    async handleRequest(requestId, statusz) {
        const request = await this.prisma.changeRequest.findUnique({ where: { id: requestId } });
        if (!request)
            throw new common_1.NotFoundException('Kérelem nem található');
        if (statusz === 'APPROVED') {
            if (request.tipus === 'NEV_MODOSITAS') {
                await this.prisma.user.update({
                    where: { id: request.userId },
                    data: { nev: request.ujErtek },
                });
            }
            else if (request.tipus === 'ADMIN_KERELEM') {
                await this.prisma.user.update({
                    where: { id: request.userId },
                    data: { admin: request.ujErtek === 'true' },
                });
            }
        }
        return this.prisma.changeRequest.update({
            where: { id: requestId },
            data: { statusz },
        });
    }
    async toggleBan(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('Felhasználó nem található');
        return this.prisma.user.update({
            where: { id },
            data: { isBanned: !user.isBanned },
        });
    }
    async remove(id) {
        return this.prisma.user.delete({ where: { id } });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map