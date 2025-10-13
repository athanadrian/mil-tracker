'use client';

import React from 'react';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';

type Props = {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
  name?: string | null; // για tooltip
};

export const ImageWithFallback = ({
  src,
  alt = 'εικόνα',
  size = 30,
  className,
  name,
}: Props) => {
  const [errored, setErrored] = React.useState(false);
  const safeSrc = (src ?? '').trim();

  // Αν δεν έχουμε src ή έχει γίνει error -> AppIcon
  if (!safeSrc || errored) {
    return (
      <AppIcon
        icon={appIcons.flag} // βάλε όποιο icon θες
        size={size}
        className={className}
        tooltipText={name ?? undefined}
      />
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'cover' }}
      onLoad={() => console.debug('[Flag] loaded:', safeSrc)}
      onError={() => {
        console.warn('[Flag] load failed for:', safeSrc);
        setErrored(true); // -> AppIcon
      }}
    />
  );
};
export default ImageWithFallback;
