'use client';

import * as React from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import AppIcon from './AppIcon'; // προσαρμοσμένο στο project σου

type Variant = 'default' | 'view' | 'edit' | 'delete';

const COLORED_VARIANTS = new Set<Variant>(['view', 'edit', 'delete']);

const variantStyles: Record<Exclude<Variant, 'default'>, string> = {
  view: 'text-blue-600 hover:bg-blue-50 focus:bg-blue-50',
  edit: 'text-green-600 hover:bg-green-50 focus:bg-green-50',
  delete: 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10',
};

export type AppActionMenuItemProps = {
  label: React.ReactNode;
  onAction?: () => void;

  /** Συμβατότητα με παλιό API: */
  onClick?: (e: Event | React.SyntheticEvent) => void;
  onSelect?: (e: Event | React.SyntheticEvent) => void;

  /** Αν true, ΔΕΝ κλείνει το menu μετά το click */
  preventClose?: boolean;

  /** Αν true (default), blur + rAF + optional delay πριν τρέξει η ενέργεια */
  safe?: boolean;

  /** ms καθυστέρηση πριν την onAction όταν safe=true */
  actionDelay?: number;

  variant?: Variant;
  disabled?: boolean;
  /** Μπορεί να είναι ReactNode (π.χ. <Icon/>) ή key για AppIcon */
  icon?: React.ReactNode;
  className?: string;
  inset?: boolean;
  rightSlot?: React.ReactNode;
};

const AppActionMenuItem = ({
  label,
  onAction,
  onClick,
  onSelect,
  preventClose = false,
  safe = true,
  actionDelay = 0,
  variant = 'default',
  disabled = false,
  icon,
  className,
  inset,
  rightSlot,
}: AppActionMenuItemProps) => {
  const coloredClass =
    variant !== 'default' && COLORED_VARIANTS.has(variant)
      ? (variantStyles as any)[variant] ?? ''
      : '';

  const renderedIcon = React.isValidElement(icon) ? (
    <span className='mr-2'>{icon}</span>
  ) : icon ? (
    // αν περνάς string key για AppIcon, προσαρμόσου αναλόγως
    <AppIcon icon={icon as any} className='w-4 h-4 mr-2' />
  ) : null;

  const runUserHandlers = (evt: Event | React.SyntheticEvent) => {
    onSelect?.(evt);
    onClick?.(evt);
    onAction?.();
  };

  const handleSelect = (e: Event | React.SyntheticEvent) => {
    if (disabled) {
      (e as any)?.preventDefault?.();
      return;
    }

    const run = () => {
      if (actionDelay > 0) setTimeout(() => runUserHandlers(e), actionDelay);
      else runUserHandlers(e);
    };

    if (preventClose) {
      (e as any)?.preventDefault?.();
      if (safe) {
        const ae = document.activeElement;
        if (ae instanceof HTMLElement) ae.blur();
        requestAnimationFrame(run);
      } else {
        run();
      }
      return;
    }

    // default: αφήνουμε το menu να κλείσει, αλλά κάνουμε safe run
    if (safe) {
      const ae = document.activeElement;
      if (ae instanceof HTMLElement) ae.blur();
      requestAnimationFrame(run);
    } else {
      run();
    }
  };

  return (
    <DropdownMenuItem
      onSelect={handleSelect as any}
      disabled={disabled}
      className={cn(
        'flex items-center justify-between gap-2',
        inset && 'pl-8',
        coloredClass,
        className
      )}
    >
      <span className='flex items-center'>
        {renderedIcon}
        {label}
      </span>
      {rightSlot ? (
        <span className='ml-4 text-xs opacity-60'>{rightSlot}</span>
      ) : null}
    </DropdownMenuItem>
  );
};

export default AppActionMenuItem;
