export {};

declare global {
  interface Window {
    api: {
      pickFiles: (
        filters?: { name: string; extensions: string[] }[]
      ) => Promise<string[]>;
      openFile: (filePath: string) => Promise<{ ok: boolean; error?: string }>;
      showInFolder: (filePath: string) => Promise<{ ok: boolean }>;

      listCountries: () => Promise<
        { id: string; name: string; iso2: string | null }[]
      >;
      createCountry: (data: { name: string; iso2?: string }) => Promise<any>;

      addDocuments: (
        docs: { title: string; filePath: string; notes?: string }[]
      ) => Promise<any[]>;
    };
  }
}
