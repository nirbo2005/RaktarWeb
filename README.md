# RaktárWeb Fejlesztői Dokumentáció

## Technológiai Stack
- **Backend**: NestJS, Node.js, Prisma ORM
- **Adatbázis**: MySQL
- **Frontend**: Vite / React (port 5173)
- **Eszközök**: Swagger (OpenAPI), Multer (fájlfeltöltés), JWT (autentikáció), Websockets (EventsGateway)

## Rendszerkövetelmények
- Node.js (v18+)
- MySQL Server futó példány (lokális vagy Docker)

## Környezeti Változók (.env)
A `raktar-backend` könyvtárban hozz létre egy `.env` fájlt az alábbi formátumban:
```env
DATABASE_URL="mysql://root:@localhost:3306/raktar"
JWT_SECRET="valtoztasd-meg-egy-eros-titkositasi-kulcsra"
PORT=3000
```
## Inditási útmutató

A projekt gyökérkönyvtárában található package.json scriptek automatizálják a telepítést és a futtatást a concurrently segítségével.

 # 1. Előkészítés és Telepítés
Ez a parancs telepíti az összes függőséget a gyökérben, a backendben és a frontendben is:
```
npm run install-all
```
# 2. Adatbázis inicializálása
Első indítás előtt, vagy az adatbázis alaphelyzetbe állításához:

```
npm run db-reset
```
Ez a parancs legenerálja a Prisma klienst, törli a meglévő táblákat, lefuttatja a migrációt, és feltölti a tesztadatokat (seed).

# 3. Alkalmazás indítása
A teljes rendszer (Frontend + Backend) egyidejű indítása:

```
npm run dev
```
# 4. Egyéb hasznos parancsok
Frissítés: Ha csak a sémát módosítottad és szinkronizálni akarod a DB-vel: npm run refresh

Csak Backend: 
```
npm run run-backend
```
Csak Frontend:
```
npm run run-frontend
```

## Swagger Dokumentáció
A backend futása után a teljes interaktív dokumentáció elérhető:
http://localhost:3000/api-docs#/
