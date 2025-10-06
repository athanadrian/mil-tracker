// lib/runtime.ts
export function isElectron() {
  if (typeof window === 'undefined') return false;
  return (
    !!(window as any).process?.versions?.electron ||
    (navigator.userAgent || '').toLowerCase().includes('electron')
  );
}

export function toRelative(absOrRel: string, mediaRoot?: string) {
  if (!mediaRoot) return absOrRel;
  const root = mediaRoot.replace(/[/\\]+$/, '');
  return absOrRel.startsWith(root)
    ? absOrRel.slice(root.length).replace(/^[/\\]+/, '')
    : absOrRel;
}

export function fileSrc(path: string, mediaRoot?: string) {
  // για previews σε Electron
  const p = path.match(/^[A-Za-z]:[\\/]/) ? path.replace(/\\/g, '/') : path;
  const base = p.startsWith('/')
    ? p
    : mediaRoot
    ? `${mediaRoot.replace(/[/\\]+$/, '')}/${p}`
    : p;
  return `file://${base.replace(/\\/g, '/')}`;
}
