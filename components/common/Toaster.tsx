'use client';

import * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from 'next-themes';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner theme={theme === 'system' ? 'system' : (theme as any)} {...props} />
  );
};

export { Toaster };
export default Toaster;
