'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type AppAlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: React.ReactNode;
  description?: React.ReactNode;

  /** Κείμενο κουμπιών */
  confirmLabel?: string;
  cancelLabel?: string;

  /** Ενέργεια επιβεβαίωσης (μπορεί να είναι async) */
  onConfirm: () => void | Promise<void>;

  /** styling / control */
  confirmVariant?: ButtonVariant;
  confirmClassName?: string;
  cancelVariant?: ButtonVariant;
  cancelClassName?: string;
  confirmDisabled?: boolean;

  /** Close behavior */
  closeOnConfirmSuccess?: boolean;
};

const AppAlertDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'OK',
  cancelLabel = 'Άκυρο',
  onConfirm,
  confirmVariant = 'default',
  confirmClassName,
  cancelVariant = 'outline',
  cancelClassName,
  confirmDisabled = false,
  closeOnConfirmSuccess = true,
}: AppAlertDialogProps) => {
  const [submitting, setSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    if (submitting || confirmDisabled) return;
    try {
      setSubmitting(true);
      await onConfirm?.();
      if (closeOnConfirmSuccess) onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              type='button'
              variant={cancelVariant}
              className={cancelClassName}
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {cancelLabel}
            </Button>
          </AlertDialogCancel>

          <AlertDialogAction asChild>
            <Button
              type='button'
              variant={confirmVariant}
              className={confirmClassName}
              onClick={handleConfirm}
              disabled={submitting || confirmDisabled}
            >
              {submitting ? 'Παρακαλώ περιμένετε…' : confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AppAlertDialog;
