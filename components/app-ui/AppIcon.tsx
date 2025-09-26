'use client';

import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { appIcons } from '@/constants/app-icons';
import { cn } from '@/lib/utils';

// type IconComponentProps = {
//   size?: number;
//   color?: string;
//   className?: string;
//   style?: React.CSSProperties;
//   onClick?: React.MouseEventHandler<SVGElement>;
// };

type IconComponentProps = Omit<React.SVGProps<SVGSVGElement>, 'ref'> & {
  /** πολλά icon libs (lucide) δέχονται size */
  size?: number | string;
};

type IconLike =
  | keyof typeof appIcons
  | React.ReactElement<any>
  | React.ComponentType<IconComponentProps>;

type TooltipTriggerSafeProps = {
  children: React.ReactNode;
};

const TooltipTriggerSafe: React.FC<TooltipTriggerSafeProps> = ({
  children,
}) => {
  // αν δεν είναι valid element, τυλίγουμε σε <span> ώστε να δουλέψει το asChild
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

type PlainElementProps = { children: React.ReactNode };
const PlainElement: React.FC<PlainElementProps> = ({ children }) => (
  <>{children}</>
);

export interface AppIconProps {
  icon: IconLike;
  color?: string;
  size?: number;
  link?: unknown; // μόνο για truthy check/Styling
  onClick?: React.MouseEventHandler<SVGElement>;
  className?: string;
  style?: React.CSSProperties;
  tooltipText?: React.ReactNode;
  tooltipClassName?: string;
  /** για screen readers */
  srText?: string;
  /** προαιρετικό aria-label στο wrapper */
  ariaLabel?: string;
  /** custom κλάσεις στο wrapper */
  wrapperClassName?: string;
}

const AppIcon: React.FC<AppIconProps> = ({
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
}) => {
  const Element = tooltipText ? TooltipElement : PlainElement;

  const clickable = Boolean(link);
  const wrapperCls = cn(
    'inline-flex items-center',
    clickable && 'cursor-pointer',
    wrapperClassName
  );
  const iconCls = cn(className);

  // αν έχουμε ορατό κείμενο για SR, κρύβουμε το SVG από τα SR
  const ariaHidden: true | undefined = srText || ariaLabel ? true : undefined;

  let IconNode: React.ReactNode = null;

  if (typeof icon === 'string') {
    const IconComponent = appIcons[icon] as
      | React.ComponentType<IconComponentProps>
      | undefined;
    if (IconComponent) {
      IconNode = (
        <IconComponent
          size={size}
          color={color}
          onClick={onClick}
          className={iconCls}
          aria-hidden={ariaHidden}
          focusable='false'
          style={{ width: size, height: size, ...style }}
        />
      );
    } else {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn(`⚠️ AppIcon: icon "${icon}" not found in appIcons.`);
      }
    }
  } else if (React.isValidElement(icon)) {
    const el = icon as React.ReactElement<any>;
    const existing = (el.props ?? {}) as {
      className?: string;
      style?: React.CSSProperties;
    };
    IconNode = React.cloneElement(icon as React.ReactElement<any>, {
      size,
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
        size={size}
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
