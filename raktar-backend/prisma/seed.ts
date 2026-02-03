import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Seedelés megkezdése ---')

  // 1. TERMÉKEK (STOCK) BETÖLTÉSE
  const stockPath = path.join(__dirname, 'stock.json')
  const stockRaw = fs.readFileSync(stockPath, 'utf-8')
  const stocks = JSON.parse(stockRaw)

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
    })
  }
  console.log(`✅ ${stocks.length} termék szinkronizálva.`)

  // 2. FELHASZNÁLÓK (USERS) BETÖLTÉSE
  const usersPath = path.join(__dirname, 'users.json')
  const usersRaw = fs.readFileSync(usersPath, 'utf-8')
  const users = JSON.parse(usersRaw)

  // Jelszó hashelése (fix 123456 mindenki számára)
  const plainPassword = '123456';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { felhasznalonev: user.felhasznalonev },
      update: {
        nev: user.nev,
        admin: user.admin,
        // Opcionálisan frissíthetjük a jelszót is seedelésnél:
        // jelszo: hashedPassword,
      },
      create: {
        nev: user.nev,
        felhasznalonev: user.felhasznalonev,
        jelszo: hashedPassword,
        admin: user.admin,
      },
    })
  }
  console.log(`✅ ${users.length} felhasználó szinkronizálva.`)

  console.log('--- Seedelés sikeresen befejeződött ---')
}

main()
  .catch((e) => {
    console.error('Hiba a seedelés során:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
