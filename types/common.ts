export type ImagePathsJSON = {
  avatar?: string | null; // προαιρετικό "κύριο"
  gallery: string[]; // λίστα paths
  meta?: {
    savedAs: 'absolute' | 'relative' | 'url';
    mediaRoot?: string; // όταν relative
    addedAt?: string; // ISO
  };
};

export type Option = { id: string; label: string } & Record<string, string>;

export type OptionIVL<T extends string = string> = {
  id: T;
  value: T;
  label: string;
};
