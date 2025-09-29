## Εξαγωγή .exe

```bash
npm run prisma:generate
rm -rf dist .next
npm run build
npm run dist:win
```

```cmd
αν θέλω να δουλέψει το debug.log πρε΄πει να προσθέσω
στο c/users/{my-user}/AppData/roaming/mil tracker/
το αρχείο debug-health.flag (παίζει το ρόλο flag)
```

```cmd
να μεταφέρουμε κι άλλα IPC σε modules
(π.χ. agreements, orgUnits, equipment categories) ή να
προσθέσουμε Zod validation; Θα στο στήσω κατευθείαν.
```

```cmd
DATABASE_URL="file:../data/mil.db" npx prisma migrate dev --name .........
npx prisma generate --schema=prisma/schema.prisma
```

```cmd
WIN
set MIL_DEBUG=1 && "C:\Users\group8\Documents\DEV\ai-e-nis\mil-tracker\dist\win-unpacked\Mil Tracker.exe"
MAC
MIL_DEBUG=1 /Applications/Mil\ Tracker.app/Contents/MacOS/Mil\ Tracker


DATABASE_URL="file:./data/mil.db"
```

> Καθάρισμα main.cjs
> Καθάρισμα package.json
> Καθάρισμα global.d.ts
> Καθάρισμα

> **\*** add migration after setting up DB prisma

```bash
npx prisma migrate dev --name (migration distinctive name)
```

> **\*\*** reset migrations

```bash m -rf prisma/migrations // delete folder
npx prisma migrate reset // reset migrations
npx prisma migrate dev --name init  //set initial migration
```

```bash
Μετά από οποιοδήποτε write (create/update/delete) που επηρεάζει counts, κάλεσε:

import { revalidateSidebarCounts } from '@/actions/sidebar-counts'

await revalidateSidebarCounts()
```

```js

```
