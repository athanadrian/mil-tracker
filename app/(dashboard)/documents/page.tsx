'use client';
import { useState } from 'react';
type Doc = { id: string; title: string; filePath: string };

export default function Documents() {
  const [docs, setDocs] = useState<Doc[]>([]);

  const add = async () => {
    const paths = await window.api.pickFiles([
      { name: 'All', extensions: ['*'] },
    ]);
    if (!paths?.length) return;
    const payload = paths.map((p) => ({
      title: p.split(/[/\\]/).pop() || 'Untitled',
      filePath: p,
    }));
    const created = await window.api.addDocuments(payload);
    setDocs((d) => [...created, ...d]);
  };

  return (
    <div className='space-y-4'>
      <button className='border rounded-xl px-3 py-2' onClick={add}>
        Προσθήκη Εγγράφων
      </button>
      <div className='grid gap-2'>
        {docs.map((d) => (
          <div
            key={d.id}
            className='rounded-xl border p-3 flex items-center justify-between'
          >
            <div>
              <div className='font-medium'>{d.title}</div>
              <div className='text-xs opacity-60 truncate max-w-xl'>
                {d.filePath}
              </div>
            </div>
            <div className='flex gap-2'>
              <button
                className='border rounded-lg px-2 py-1'
                onClick={() => window.api.openFile(d.filePath)}
              >
                Άνοιγμα
              </button>
              <button
                className='border rounded-lg px-2 py-1'
                onClick={() => window.api.showInFolder(d.filePath)}
              >
                Φάκελος
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
