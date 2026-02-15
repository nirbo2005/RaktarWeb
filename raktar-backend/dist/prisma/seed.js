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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- Seedelés megkezdése ---');
    const stockPath = path.join(__dirname, 'stock.json');
    const stockRaw = fs.readFileSync(stockPath, 'utf-8');
    const stocks = JSON.parse(stockRaw);
    for (const item of stocks) {
        await prisma.stock.upsert({
            where: { id: item.id },
            update: {
                nev: item.nev,
                gyarto: item.gyarto,
                lejarat: new Date(item.lejarat),
                ar: item.ar,
                mennyiseg: item.mennyiseg,
                parcella: item.parcella,
            },
            create: {
                id: item.id,
                nev: item.nev,
                gyarto: item.gyarto,
                lejarat: new Date(item.lejarat),
                ar: item.ar,
                mennyiseg: item.mennyiseg,
                parcella: item.parcella,
            },
        });
    }
    console.log(`✅ ${stocks.length} termék szinkronizálva.`);
    const usersPath = path.join(__dirname, 'users.json');
    const usersRaw = fs.readFileSync(usersPath, 'utf-8');
    const users = JSON.parse(usersRaw);
    for (const user of users) {
        const passwordToHash = user.jelszo || 'DefaultPass123!';
        const hashedPassword = await bcrypt.hash(passwordToHash, 10);
        await prisma.user.upsert({
            where: { felhasznalonev: user.felhasznalonev },
            update: {
                nev: user.nev,
                admin: user.admin,
                email: user.email,
                telefonszam: user.telefonszam,
            },
            create: {
                nev: user.nev,
                felhasznalonev: user.felhasznalonev,
                jelszo: hashedPassword,
                admin: user.admin,
                email: user.email,
                telefonszam: user.telefonszam,
                isBanned: false,
            },
        });
    }
    console.log(`✅ ${users.length} felhasználó szinkronizálva az új mezőkkel.`);
    console.log('--- Seedelés sikeresen befejeződött ---');
}
main()
    .catch((e) => {
    console.error('Hiba a seedelés során:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map