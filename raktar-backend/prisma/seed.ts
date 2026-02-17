import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seedelés megkezdése ---');

  // 1. TERMÉKEK (STOCK) SZINKRONIZÁLÁSA
  const stockPath = path.join(process.cwd(), 'prisma', 'stock.json');
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

  // 2. FELHASZNÁLÓK (USER) SZINKRONIZÁLÁSA
  const usersPath = path.join(process.cwd(), 'prisma', 'users.json');
  const usersRaw = fs.readFileSync(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);

  for (const user of users) {
    // Jelszó titkosítása - ha a JSON-ben van jelszó azt használja, ha nincs, akkor egy defaultot
    const passwordToHash = user.jelszo || 'DefaultPass123!';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    await prisma.user.upsert({
      where: { felhasznalonev: user.felhasznalonev },
      update: {
        nev: user.nev,
        admin: user.admin,
        email: user.email,
        telefonszam: user.telefonszam,
        // Itt a jelszót nem frissítjük upsertnél, hogy ne írjuk felül 
        // a user által már megváltoztatott jelszót véletlenül
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
