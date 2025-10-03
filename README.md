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
// ΠΑΡΑΔΕΙΓΜΑ ΧΡΣΗΣΗΣ REVALIDATE TAG
'use server';

import { prisma } from '@/lib/db';
import { revalidateLookups } from '@/app/_lib/selectOptionsCache';
import { revalidateSidebarCounts } from '@/server/lookups'; // ήδη το έχεις

export async function createCountry(data: { name: string, iso2?: string }) {
  const country = await prisma.country.create({ data });

  // revalidate στοχευμένα
  revalidateLookups('countries');

  // αν εμφανίζεται στους sidebar counters
  revalidateSidebarCounts();

  return country;
}

export async function updateRank(
  id: string,
  data: { name?: string, code?: string }
) {
  const rank = await prisma.rank.update({ where: { id }, data });
  revalidateLookups('ranks'); // μόνο ό,τι άλλαξε
  return rank;
}

export async function deleteBranch(id: string) {
  await prisma.serviceBranch.delete({ where: { id } });
  revalidateLookups('branches'); // καθάρισε λίστες κλάδων
}
```

```terminal

Sheet: Regions
name*    code    description
Europe   EU
Middle East  ME


name unique (στο schema), code optional.

Sheet: Countries
name*    iso2    region (by name)    flag    countryImage
Greece   GR      Europe
Cyprus   CY      Europe


name unique. iso2 unique (αν υπάρχει).

region → αντιστοίχιση σε Region.name.

Sheet: Branches
name*                 code   country (by iso2 or name)
Στρατός Ξηράς         ΣΞ     GR
Πολεμική Αεροπορία    ΠΑ     GR


country → πρώτα ψάχνουμε iso2, αλλιώς name.

Sheet: Ranks
name*	code	tier* (ENLISTED|OFFICER|WARRANT|OTHER)	level	branch (by code or name)
Λοχίας	HA-SGT	ENLISTED	3	ΣΞ
Ανθυπολοχαγός	HA-2LT	OFFICER	1	ΣΞ

tier είναι enum (RankTier).

branch → με code προτιμητέα, αλλιώς με name.

Sheet: Organizations
name*	code	type* (GOVERNMENT|MILITARY|NGO|OTHER)	country (by iso2 or name)
ΓΕΣ	HAGS	MILITARY	GR

type είναι enum (OrganizationType).

Sheet: Units
name*	code	type* (HQ|FORMATION|UNIT|SUBUNIT|OTHER)	country (by iso2 or name)*	branch (by code or name)	parentCode	latitude	longitude
1η Στρατιά	1STR	FORMATION	GR	ΣΞ		39.62	22.41
1η ΤΑΞ ΠΖ	1TAXPZ	UNIT	GR	ΣΞ	1STR

country απαιτείται στο schema σου.

branch optional αλλά αν υπάρχει στο Excel θα συνδεθεί.

parentCode λύνει το δέντρο. Για dry run ελέγχεται in-memory ότι υπάρχει στο ίδιο αρχείο (με code ή name). Για πραγματική εισαγωγή βρίσκει parent κατά προτίμηση με code, αλλιώς name (+ χώρα για σταθερότητα).

Sheet: Personnel (ΝΕΟ)
serviceNumber*	firstName*	lastName*	rank (by code or name)	branch (by code or name)	unit (by code or name)	country (by iso2 or name)	position	email	phone
12345	Γιώργος	Παπαδόπουλος	HA-2LT	ΣΞ	1TAXPZ	GR	Διοικητής Ουλαμού	g.pap@example.com
	+30 69xxxxxxxx

Unique key: serviceNumber.

Όλα τα foreign refs είναι optional (αν δεν βρεθούν, καταγράφεται error αλλά συνεχίζει το process).

Note: Αν στο schema σου τα fields έχουν άλλα names (π.χ. givenName/familyName), προσαρμόζεις τα data στο server action (τα έχω σχολιάσει).

Sheet: Equipment (ΝΕΟ)
code*	name*	serial	type	status	unit (by code or name)	notes
HUMV-001	HMMWV	A1B2C3D4	Vehicle	Active	1TAXPZ	Ανατεθειμένο σε 1ο Λόχο
RF-PRC152-01	PRC-152	152-XYZ-001	Radio	In Service	1TAXPZ

Θεωρώ code ως unique (αν υπάρχει), αλλιώς προσπαθεί με serial.

Το unit αν δοθεί, συνδέεται.



Αν θέλεις:

Να περάσω ranks και για ΠΝ/ΠΑ/ΕΦ (με αντίστοιχα codes) ώστε να γεμίσουν και τα rank στα Personnel για αυτά τα branches.

Περισσότερα Units/πιο βαθιά δέντρα (π.χ. Τάγμα → Λόχος → Διμοιρία).

Συγκεκριμένες ονομασίες/κωδικοποιήσεις (π.χ. NATO STANAG-like codes).
```
