// components/ImageManager.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { isElectron, toRelative, fileSrc } from '@/lib/electron-utils';

export type ImagePathsJSON = {
  avatar?: string | null;
  gallery: string[];
  meta?: {
    savedAs: 'absolute' | 'relative' | 'url';
    mediaRoot?: string;
    addedAt?: string;
  };
};

type StorageKind = 'string' | 'json';
type Mode = 'single' | 'multiple';

type Props =
  | {
      storage: 'string';
      mode?: Mode; // single έχει νόημα εδώ (multiple => παίρνει το πρώτο)
      value?: string | null;
      onChange?: (v: string | null) => void;
      storeAs?: 'absolute' | 'relative' | 'url';
      mediaRoot?: string;
      uploadFile?: (file: File) => Promise<string>; // web fallback -> URL
      label?: string;
      className?: string;
    }
  | {
      storage: 'json';
      mode?: Mode;
      value?: ImagePathsJSON | null;
      onChange?: (v: ImagePathsJSON) => void;
      storeAs?: 'absolute' | 'relative' | 'url';
      mediaRoot?: string;
      uploadFile?: (file: File) => Promise<string>; // web fallback -> URL
      label?: string;
      className?: string;
    };

const joinPath = (root?: string, rel?: string) =>
  root
    ? `${root.replace(/[/\\]+$/, '')}/${String(rel || '').replace(
        /^[/\\]+/,
        ''
      )}`
    : String(rel || '');

export default function ImageManager(props: Props) {
  const {
    mode = 'multiple',
    storeAs = 'absolute',
    mediaRoot,
    uploadFile,
    label = 'Εικόνες',
    className,
  } = props as any;

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const objectUrlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    return () => {
      // revoke on unmount
      for (const u of objectUrlsRef.current) URL.revokeObjectURL(u);
      objectUrlsRef.current = [];
    };
  }, []);
  // -------- helpers to read/write "value" ανεξαρτήτως storage --------
  const getGallery = (): string[] => {
    if (props.storage === 'string') return props.value ? [props.value] : [];
    return props.value?.gallery ?? [];
  };
  const getAvatar = (): string | null => {
    if (props.storage === 'string') return props.value ?? null;
    return props.value?.avatar ?? null;
  };

  const commit = (nextGallery: string[], avatar?: string | null) => {
    if (props.storage === 'string') {
      // single string: βάλε το πρώτο (ή null)
      const first = nextGallery[0] ?? null;
      props.onChange?.(first);
    } else {
      const next: ImagePathsJSON = {
        avatar:
          avatar === undefined
            ? props.value?.avatar ?? nextGallery[0] ?? null
            : avatar,
        gallery: nextGallery,
        meta: {
          ...(props.value?.meta ?? {}),
          savedAs: storeAs,
          mediaRoot,
          addedAt: props.value?.meta?.addedAt ?? new Date().toISOString(),
        },
      };
      (props as any).onChange?.(next);
    }
  };

  const addImages = (paths: string[]) => {
    const normalized =
      storeAs === 'relative'
        ? mediaRoot
          ? paths.map((p) => toRelative(p, mediaRoot))
          : paths // αν δεν έχεις mediaRoot, κράτα absolute
        : paths;

    // de-dup
    const cur = new Set(getGallery());
    const next =
      mode === 'single'
        ? normalized[0]
          ? [normalized[0]]
          : []
        : Array.from(new Set([...cur, ...normalized]));

    commit(next);
  };

  // -------- pick via Electron or input file --------
  const openPicker = async () => {
    if (isElectron() && window.api?.files?.pick) {
      setBusy(true);
      try {
        const filePaths = await window.api.files.pick([
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
        ]);
        if (!filePaths?.length) return;
        addImages(filePaths);
      } finally {
        setBusy(false);
      }
    } else {
      inputRef.current?.click();
    }
  };

  const onFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      if (uploadFile) {
        const urls: string[] = [];
        for (const f of files) urls.push(await uploadFile(f));
        addImages(urls);
      } else {
        const urls = files.map((f) => {
          const u = URL.createObjectURL(f);
          objectUrlsRef.current.push(u);
          return u;
        });
        addImages(urls);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (i: number) => {
    const cur = getGallery();
    const removed = cur[i];
    // αν ήταν objectURL, revoke
    if (removed?.startsWith('blob:')) {
      URL.revokeObjectURL(removed);
      objectUrlsRef.current = objectUrlsRef.current.filter(
        (u) => u !== removed
      );
    }
    const next = [...cur];
    next.splice(i, 1);
    const oldAv = getAvatar();
    const newAv = oldAv && next.includes(oldAv) ? oldAv : next[0] ?? null;
    commit(next, newAv);
  };

  const setAvatar = (i: number) => {
    const cur = getGallery();
    const av = cur[i] ?? null;
    commit(cur, av);
  };

  const openInOS = async (p: string) => {
    if (!isElectron() || !window.api?.files?.open) return;
    const abs = storeAs === 'relative' ? joinPath(mediaRoot, p) : p;
    await window.api.files.open(abs);
  };

  const revealInOS = async (p: string) => {
    if (!isElectron() || !window.api?.files?.showInFolder) return;
    const abs = storeAs === 'relative' ? joinPath(mediaRoot, p) : p;
    await window.api.files.showInFolder(abs);
  };

  const gallery = getGallery();
  const avatar = getAvatar();

  return (
    <div className={`rounded-md border bg-muted/20 p-3 ${className ?? ''}`}>
      <div className='flex items-center justify-between mb-2'>
        <div className='font-medium'>{label}</div>
        <div className='text-xs text-muted-foreground'>
          {mode === 'multiple' ? 'Πολλαπλές' : 'Μία'} • αποθήκευση:{' '}
          <b>{storeAs}</b>
          {storeAs === 'relative' && mediaRoot ? ` (root: ${mediaRoot})` : ''}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Button
          type='button'
          variant='secondary'
          size='sm'
          onClick={openPicker}
          disabled={busy}
        >
          Επιλογή {mode === 'multiple' ? 'εικόνων' : 'εικόνας'}
        </Button>
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          multiple={mode === 'multiple'}
          className='hidden'
          onChange={onFilesChange}
        />
      </div>

      {!!gallery.length && (
        <div className='mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2'>
          {gallery.map((p, i) => {
            // Electron preview με file:// — αλλιώς (web) δείχνουμε το ίδιο string
            const src =
              isElectron() && storeAs !== 'url' ? fileSrc(p, mediaRoot) : p;
            const isAv = avatar === p;
            return (
              <div
                key={`${p}-${i}`}
                className='relative border rounded-md overflow-hidden group'
              >
                <img
                  src={src}
                  className={`block w-full h-32 object-cover ${
                    isAv ? 'ring-2 ring-blue-500' : ''
                  }`}
                />
                <div className='absolute inset-x-0 bottom-0 p-1 bg-black/40 opacity-0 group-hover:opacity-100 transition'>
                  <div className='flex items-center gap-1 justify-end'>
                    {mode === 'multiple' && !isAv && (
                      <Button
                        size='sm'
                        variant='secondary'
                        onClick={() => setAvatar(i)}
                      >
                        Avatar
                      </Button>
                    )}
                    {isElectron() && (
                      <>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => openInOS(p)}
                        >
                          Άνοιγμα
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => revealInOS(p)}
                        >
                          Φάκελος
                        </Button>
                      </>
                    )}
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => removeAt(i)}
                    >
                      Διαγραφή
                    </Button>
                  </div>
                </div>
                {isAv && (
                  <span className='absolute top-1 left-1 px-1.5 py-0.5 text-[10px] rounded bg-blue-600 text-white'>
                    Avatar
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
