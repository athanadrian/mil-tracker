export type ImagePathsJSON = {
  avatar?: string | null; // προαιρετικό "κύριο"
  gallery: string[]; // λίστα paths
  meta?: {
    savedAs: 'absolute' | 'relative' | 'url';
    mediaRoot?: string; // όταν relative
    addedAt?: string; // ISO
  };
};
