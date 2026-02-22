import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding folyamat elindítva...');

  
  await prisma.batch.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  
  const usersPath = path.join(__dirname, 'seed-users.json');
  if (fs.existsSync(usersPath)) {
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
    for (const u of usersData) {
      const hashedPassword = await bcrypt.hash(u.jelszo, 10);
      await prisma.user.create({
        data: {
          nev: u.nev,
          felhasznalonev: u.felhasznalonev,
          jelszo: hashedPassword,
          rang: u.rang as Role,
          email: u.email,
          telefonszam: u.telefonszam,
          mustChangePassword: u.mustChangePassword || false
        },
      });
    }
    console.log(`✅ ${usersData.length} felhasználó létrehozva.`);
  }

  
  const productsPath = path.join(__dirname, 'seed-products.json');
  if (fs.existsSync(productsPath)) {
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    
    for (const item of productsData) {
      const product = await prisma.product.create({
        data: {
          nev: item.nev,
          gyarto: item.gyarto,
          kategoria: item.kategoria,
          beszerzesiAr: item.beszerzesiAr,
          eladasiAr: item.eladasiAr,
          suly: item.suly,
          minimumKeszlet: item.minimumKeszlet,
        },
      });

      if (item.batches && item.batches.length > 0) {
        const batchData = item.batches.map((b: any) => ({
          productId: product.id,
          parcella: b.parcella,
          mennyiseg: b.mennyiseg,
          lejarat: b.lejarat ? new Date(b.lejarat) : null,
        }));
        
        await prisma.batch.createMany({
          data: batchData,
        });
      }
    }
    console.log(`✅ ${productsData.length} termék feltöltve.`);
  }

  console.log('✨ Seeding sikeresen befejeződött!');
}

main()
  .catch((e) => {
    console.error('❌ Hiba a seeding során:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
