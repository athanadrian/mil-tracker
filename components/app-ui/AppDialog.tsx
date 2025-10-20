// components/app-ui/AppDialog.tsx
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type AppDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  modal?: boolean;
  rootProps?: Omit<
    React.ComponentPropsWithoutRef<typeof Dialog>,
    'open' | 'onOpenChange' | 'modal' | 'children'
  >;

  /** Extra props που θα “περαστούν” στο <DialogContent /> */
  contentProps?: Omit<
    React.ComponentPropsWithoutRef<typeof DialogContent>,
    'className' | 'children'
  >;
};

const AppDialog = ({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
  modal = true,
  rootProps,
  contentProps,
}: AppDialogProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      modal={modal}
      {...rootProps}
    >
      <DialogContent className={className} {...contentProps}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className='space-y-4'>{children}</div>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
};

export default AppDialog;
