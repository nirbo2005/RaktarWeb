import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Seedelés megkezdése...')
  const dataPath = path.join(__dirname, 'data.json')
  const rawData = fs.readFileSync(dataPath, 'utf-8')
  const stocks = JSON.parse(rawData)

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

  console.log(`Kész! ${stocks.length} termék sikeresen szinkronizálva.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
