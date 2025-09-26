export {};

declare global {
  module '*.css';
  interface Window {
    api: {
      pickFiles: (
        filters?: { name: string; extensions: string[] }[]
      ) => Promise<string[]>;
      openFile: (filePath: string) => Promise<{ ok: boolean; error?: string }>;
      showInFolder: (filePath: string) => Promise<{ ok: boolean }>;
    };
  }
}
