export {};
declare module 'mime';
declare global {
  interface Window {
    api?: {
      files: {
        pick: (
          filters?: { name?: string; extensions?: string[] }[]
        ) => Promise<string[]>;
        open: (filePath: string) => Promise<{ ok: boolean; error?: string }>;
        showInFolder: (filePath: string) => Promise<{ ok: boolean }>;
      };
    };
  }
}
