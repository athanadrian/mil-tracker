'use client';

import * as React from 'react';
import Link from 'next/link';
import type { UrlObject } from 'url';

import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';

type AdminPageTitleProps = {
  title: React.ReactNode;
  subtitle?: string;

  actionLabel?: React.ReactNode;
  /** Δέχεται είτε string είτε UrlObject. Θα μετατραπεί σε UrlObject πριν πάει στο <Link>. */
  actionHref?: string | UrlObject;
  onAction?: () => void;

  actionIconKey?: keyof typeof appIcons;
  actionIconEl?: React.ReactNode;

  actionDisabled?: boolean;
  children?: React.ReactNode;
  className?: string;
};

const AdminPageTitle = ({
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  actionIconKey,
  actionIconEl,
  actionDisabled = false,
  children,
  className = '',
}: AdminPageTitleProps) => {
  const hrefObj = React.useMemo<UrlObject | undefined>(() => {
    if (!actionHref) return undefined;
    return typeof actionHref === 'string'
      ? ({ pathname: actionHref } as UrlObject)
      : actionHref;
  }, [actionHref]);

  const iconNode = React.useMemo<React.ReactNode>(() => {
    if (actionIconEl)
      return <span className='mr-2 inline-flex'>{actionIconEl}</span>;
    if (actionIconKey)
      return (
        <AppIcon icon={appIcons[actionIconKey]} size={18} className='mr-2' />
      );
    return null;
  }, [actionIconEl, actionIconKey]);

  const ActionContent = (
    <>
      {iconNode}
      {actionLabel}
    </>
  );

  const renderAction = () => {
    if (!actionLabel) return null;

    if (hrefObj) {
      return (
        <Button asChild disabled={actionDisabled}>
          <Link href={hrefObj}>{ActionContent}</Link>
        </Button>
      );
    }

    return (
      <Button onClick={onAction} disabled={actionDisabled}>
        {ActionContent}
      </Button>
    );
  };

  return (
    <div
      className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className='min-w-0'>
        <h1 className='truncate text-2xl font-bold tracking-tight gradient-title'>
          {title}
        </h1>
        {subtitle ? (
          <p className='text-sm text-muted-foreground'>{subtitle}</p>
        ) : null}
      </div>

      <div className='flex items-center gap-2'>
        {children}
        {renderAction()}
      </div>
    </div>
  );
};

export default AdminPageTitle;
