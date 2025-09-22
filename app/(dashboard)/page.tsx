'use client';
import { useEffect, useState } from 'react';

type Country = { id: string; name: string; iso2: string | null };

export default function Dashboard() {
  const [countries, setCountries] = useState<Country[]>([]);
  useEffect(() => {
    window.api
      ?.listCountries?.()
      .then(setCountries)
      .catch(() => setCountries([]));
  }, []);

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
      <div className='rounded-2xl border p-4'>
        <div className='text-sm opacity-60'>Χώρες</div>
        <div className='text-3xl font-semibold'>{countries.length}</div>
      </div>
      <div className='rounded-2xl border p-4'>
        <div className='text-sm opacity-60'>Οργανισμοί</div>
        <div className='text-3xl font-semibold'>—</div>
      </div>
      <div className='rounded-2xl border p-4'>
        <div className='text-sm opacity-60'>Προσωπικό</div>
        <div className='text-3xl font-semibold'>—</div>
      </div>
      <div className='rounded-2xl border p-4'>
        <div className='text-sm opacity-60'>Εξοπλισμός</div>
        <div className='text-3xl font-semibold'>—</div>
      </div>
    </div>
  );
}
