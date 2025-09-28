'use client';

import * as React from 'react';
import type { IconType as ReactIconType } from 'react-icons';
import type { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';

/** Ενοποιημένα props για icons. size: number για να είναι assignable σε όλα */
type IconComponentProps = Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
  color?: string;
  size?: number;
  className?: string;
};

/** Δεχόμαστε: key από appIcons, έτοιμο React element, ή component από react-icons/lucide/custom */
export type IconLike =
  | keyof typeof appIcons
  | React.ReactElement<any>
  | React.ComponentType<IconComponentProps>
  | ReactIconType
  | LucideIcon;

type TooltipTriggerSafeProps = { children: React.ReactNode };
const TooltipTriggerSafe: React.FC<TooltipTriggerSafeProps> = ({
  children,
}) => {
  const child = React.isValidElement(children) ? (
    children
  ) : (
    <span>{children}</span>
  );
  return <TooltipTrigger asChild>{child}</TooltipTrigger>;
};

type TooltipElementProps = {
  tooltipText: React.ReactNode;
  tooltipClassName?: string;
  children: React.ReactNode;
};
const TooltipElement: React.FC<TooltipElementProps> = ({
  tooltipText,
  tooltipClassName,
  children,
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTriggerSafe>{children}</TooltipTriggerSafe>
      <TooltipContent side='right' align='center'>
        <p className={tooltipClassName}>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const PlainElement: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

/** Μετατροπή σε αριθμό ΜΟΝΟ για το prop size των icon components */
const toNumericSize = (s?: string | number): number | undefined => {
  if (s == null) return undefined;
  return typeof s === 'string' ? Number.parseFloat(s) : s;
};

export interface AppIconProps {
  icon: IconLike;
  color?: string;
  size?: string | number; // εξωτερικά δέχεται και string
  link?: unknown;
  onClick?: React.MouseEventHandler<SVGElement>;
  className?: string;
  style?: React.CSSProperties;
  tooltipText?: React.ReactNode;
  tooltipClassName?: string;
  srText?: string;
  ariaLabel?: string;
  wrapperClassName?: string;
}

const AppIcon = ({
  icon,
  color,
  size = 20,
  link,
  onClick,
  className,
  style,
  tooltipText,
  tooltipClassName,
  srText,
  ariaLabel,
  wrapperClassName,
}: AppIconProps) => {
  const Element = tooltipText ? TooltipElement : PlainElement;

  const clickable = Boolean(link);
  const wrapperCls = cn(
    'inline-flex items-center',
    clickable && 'cursor-pointer',
    wrapperClassName
  );
  const iconCls = cn(className);

  // αν υπάρχει ορατό κείμενο για SR στο wrapper, κρύβουμε το SVG από τα SR
  const ariaHidden: true | undefined = srText || ariaLabel ? true : undefined;

  let IconNode: React.ReactNode = null;

  if (typeof icon === 'string') {
    const key = icon as keyof typeof appIcons; // narrow
    const IconComponent = appIcons[key] as
      | React.ComponentType<IconComponentProps>
      | undefined;
    if (IconComponent) {
      IconNode = (
        <IconComponent
          size={toNumericSize(size)} // ← πάντα number για το prop size
          color={color}
          onClick={onClick}
          className={iconCls}
          aria-hidden={ariaHidden}
          focusable='false'
          style={{ width: size, height: size, ...style }} // ← κρατάς το αρχικό (string/number) στο CSS
        />
      );
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️ AppIcon: icon "${icon}" not found in appIcons.`);
    }
  } else if (React.isValidElement(icon)) {
    const el = icon as React.ReactElement<any>;
    const existing = (el.props ?? {}) as {
      className?: string;
      style?: React.CSSProperties;
    };
    IconNode = React.cloneElement(icon as React.ReactElement<any>, {
      size: toNumericSize(size), // ← numeric
      color,
      onClick,
      className: cn(existing.className, iconCls),
      'aria-hidden': ariaHidden,
      focusable: 'false',
      style: { width: size, height: size, ...style, ...existing.style },
    });
  } else if (typeof icon === 'function') {
    const IconComponent = icon as React.ComponentType<IconComponentProps>;
    IconNode = (
      <IconComponent
        size={toNumericSize(size)} // ← numeric
        color={color}
        onClick={onClick}
        className={iconCls}
        aria-hidden={ariaHidden}
        focusable='false'
        style={{ width: size, height: size, ...style }}
      />
    );
  }

  return (
    <Element
      tooltipText={tooltipText as React.ReactNode}
      tooltipClassName={tooltipClassName}
    >
      <span className={wrapperCls} aria-label={ariaLabel}>
        {IconNode}
        {srText ? <span className='sr-only'>{srText}</span> : null}
      </span>
    </Element>
  );
};

export default AppIcon;
