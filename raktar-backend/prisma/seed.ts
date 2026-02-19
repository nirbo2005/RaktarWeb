import { PrismaClient, Role } from '@prisma/client'; // Importáld a Role enumot is
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seedelés megkezdése ---');

  // Stock seedelés (változatlan)
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

  // User seedelés - JAVÍTVA
  const usersPath = path.join(process.cwd(), 'prisma', 'users.json');
  const usersRaw = fs.readFileSync(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);

  for (const user of users) {
    const passwordToHash = user.jelszo || '123456';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    await prisma.user.upsert({
      where: { felhasznalonev: user.felhasznalonev },
      update: {
        nev: user.nev,
        rang: user.rang as Role, // admin helyett rang
        email: user.email,
        telefonszam: user.telefonszam,
        isBanned: user.isBanned || false,
      },
      create: {
        nev: user.nev,
        felhasznalonev: user.felhasznalonev,
        jelszo: hashedPassword,
        rang: user.rang as Role, // admin helyett rang
        email: user.email,
        telefonszam: user.telefonszam,
        isBanned: user.isBanned || false,
      },
    });
  }
  console.log(`✅ ${users.length} felhasználó szinkronizálva az új rangokkal.`);
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
