'use client';
import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { AppActionMenuItemProps } from '@/components/app-ui';
import { AppActionMenuItem } from '@/components/app-ui';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

type ExtraItem = Omit<
  AppActionMenuItemProps,
  // αυτά θα τα ορίσει το menu:
  'onClick' | 'onSelect'
> & {
  key: string;
};

type ConfirmDeleteCfg =
  | boolean
  | {
      title?: string;
      description?: string;
      confirmLabel?: string;
      cancelLabel?: string;
    };

type AppCrudMenuProps = {
  trigger?: React.ReactNode;
  menuIcon?: any;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  contentClassName?: string;
  portalContainer?: HTMLElement;

  showView?: boolean;
  viewLabel?: React.ReactNode;
  viewIcon?: any;
  onView?: () => void;
  viewDisabled?: boolean;

  showEdit?: boolean;
  editLabel?: React.ReactNode;
  editIcon?: any;
  onEdit?: () => void;
  editDisabled?: boolean;

  showDelete?: boolean;
  deleteLabel?: React.ReactNode;
  deleteIcon?: any;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  confirmDelete?: ConfirmDeleteCfg;

  items?: ExtraItem[];

  safe?: boolean;
  actionDelay?: number;

  children?: React.ReactNode;
};

const AppCrudMenu = ({
  trigger,
  menuIcon = appIcons.dots_menu,
  align = 'end',
  sideOffset = 4,
  contentClassName,
  portalContainer,

  showView = true,
  viewLabel = 'Προβολή',
  viewIcon = appIcons.view,
  onView,
  viewDisabled,

  showEdit = true,
  editLabel = 'Επεξεργασία',
  editIcon = appIcons.edit,
  onEdit,
  editDisabled,

  showDelete = true,
  deleteLabel = 'Διαγραφή',
  deleteIcon = appIcons.delete,
  onDelete,
  deleteDisabled,
  confirmDelete = false,

  items = [],
  safe = true,
  actionDelay = 0,

  children,
}: AppCrudMenuProps) => {
  const [openConfirm, setOpenConfirm] = React.useState(false);

  const wantView = showView && !!onView && !viewDisabled;
  const wantEdit = showEdit && !!onEdit && !editDisabled;
  const wantDelete = showDelete && !!onDelete && !deleteDisabled;

  const hasCore = wantView || wantEdit || wantDelete;
  const hasExtras = Array.isArray(items) && items.length > 0;
  const hasCustom = !!children;

  if (!hasCore && !hasExtras && !hasCustom) return null;

  const runSafe = (fn?: () => void, delay = actionDelay) => {
    const ae = document.activeElement;
    if (ae instanceof HTMLElement) ae.blur();
    requestAnimationFrame(() => {
      if (!fn) return;
      if (delay > 0) setTimeout(fn, delay);
      else fn();
    });
  };

  const defaultTrigger = (
    <button
      type='button'
      className='inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent'
      aria-label='Actions'
    >
      <AppIcon icon={menuIcon} size={16} />
    </button>
  );

  const confirmCfg =
    typeof confirmDelete === 'object'
      ? confirmDelete
      : {
          title: 'Delete?',
          description: 'This action cannot be undone.',
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
        };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {React.isValidElement(trigger) ? trigger : defaultTrigger}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          sideOffset={sideOffset}
          className={cn('min-w-[10rem]', contentClassName)}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // Αν έχεις όντως portal επέκταση, κράτα το. Αλλιώς βγάλ’ το.
          // @ts-expect-error custom prop αν έχει επεκταθεί το component
          container={portalContainer ?? undefined}
        >
          {/* Extra items */}
          {hasExtras &&
            items.map((it) => (
              <AppActionMenuItem
                key={it.key}
                label={it.label}
                icon={it.icon}
                variant={it.variant}
                disabled={!!it.disabled}
                preventClose={!!it.preventClose}
                inset={it.inset}
                rightSlot={it.rightSlot}
                safe={it.safe}
                actionDelay={it.actionDelay}
                className={it.className}
                onAction={() =>
                  it.safe ?? safe
                    ? runSafe(it.onAction, it.actionDelay ?? actionDelay)
                    : it.onAction?.()
                }
              />
            ))}

          {hasExtras && hasCore && <DropdownMenuSeparator />}

          {wantView && (
            <AppActionMenuItem
              label={viewLabel}
              variant='view'
              icon={<AppIcon icon={viewIcon} size={16} />}
              onAction={() => (safe ? runSafe(onView) : onView?.())}
            />
          )}

          {wantEdit && (
            <AppActionMenuItem
              label={editLabel}
              variant='edit'
              icon={<AppIcon icon={editIcon} size={16} />}
              onAction={() => (safe ? runSafe(onEdit) : onEdit?.())}
            />
          )}

          {wantDelete && (wantView || wantEdit) && <DropdownMenuSeparator />}

          {wantDelete && (
            <AppActionMenuItem
              label={deleteLabel}
              variant='delete'
              icon={<AppIcon icon={deleteIcon} size={16} />}
              onAction={() => {
                if (confirmDelete) {
                  return runSafe(() => setOpenConfirm(true));
                }
                return safe ? runSafe(onDelete) : onDelete?.();
              }}
            />
          )}

          {children}
        </DropdownMenuContent>
      </DropdownMenu>

      {confirmDelete && (
        <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmCfg.title ?? 'Delete?'}
              </AlertDialogTitle>
              {confirmCfg.description && (
                <AlertDialogDescription>
                  {confirmCfg.description}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {confirmCfg.cancelLabel ?? 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                onClick={() => {
                  setOpenConfirm(false);
                  requestAnimationFrame(() => onDelete?.());
                }}
              >
                {confirmCfg.confirmLabel ?? 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default AppCrudMenu;
