'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

/* --------------------------------- Context -------------------------------- */

type MultiSelectContextValue = {
  values: string[];
  setValues: (next: string[]) => void;

  open: boolean;
  setOpen: (open: boolean) => void;

  inputValue: string;
  setInputValue: (val: string) => void;

  activeIndex: number;
  setActiveIndex: (idx: number) => void;

  disabled?: boolean;
};

const MultiSelectContext = React.createContext<MultiSelectContextValue | null>(
  null
);

const useMultiSelectCtx = (): MultiSelectContextValue => {
  const ctx = React.useContext(MultiSelectContext);
  if (!ctx)
    throw new Error('MultiSelector.* must be used inside <MultiSelector>');
  return ctx;
};

/* ------------------------------- Root/Provider ------------------------------ */

export type MultiSelectorProps = {
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (vals: string[]) => void;
  disabled?: boolean;
  loop?: boolean;
  dir?: 'ltr' | 'rtl';
  className?: string;
  children?: React.ReactNode;
};

export function MultiSelector({
  values,
  defaultValues = [],
  onValuesChange,
  disabled,
  loop = false,
  className,
  children,
  dir = 'ltr',
}: MultiSelectorProps): React.JSX.Element {
  const controlled = Array.isArray(values);
  const [internal, setInternal] = React.useState<string[]>(defaultValues);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const current = controlled ? (values as string[]) : internal;

  const setValues = React.useCallback(
    (next: string[]) => {
      if (disabled) return;
      if (controlled) onValuesChange?.(next);
      else setInternal(next);
    },
    [controlled, disabled, onValuesChange]
  );

  const onKeyDown = React.useCallback<
    React.KeyboardEventHandler<HTMLDivElement>
  >(
    (e) => {
      if (disabled) return;

      const move = (delta: number) => {
        const next = activeIndex + delta;
        if (current.length === 0) {
          setActiveIndex(-1);
          return;
        }
        if (next < 0) setActiveIndex(loop ? current.length - 1 : 0);
        else if (next > current.length - 1)
          setActiveIndex(loop ? 0 : current.length - 1);
        else setActiveIndex(next);
      };

      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        inputValue.length === 0
      ) {
        if (current.length === 0) return;
        e.preventDefault();
        if (activeIndex !== -1) {
          const target = current[activeIndex];
          setValues(current.filter((v) => v !== target));
          setActiveIndex(Math.max(activeIndex - 1, -1));
        } else {
          setValues(current.slice(0, -1));
        }
      } else if (e.key === 'Enter') {
        setOpen(true);
      } else if (e.key === 'Escape') {
        if (activeIndex !== -1) setActiveIndex(-1);
        else setOpen(false);
      } else if (
        dir === 'rtl' ? e.key === 'ArrowRight' : e.key === 'ArrowLeft'
      ) {
        move(-1);
      } else if (
        dir === 'rtl' ? e.key === 'ArrowLeft' : e.key === 'ArrowRight'
      ) {
        if (activeIndex !== -1 || loop) move(+1);
      }
    },
    [activeIndex, current, inputValue.length, loop, setValues, dir, disabled]
  );

  const ctx = React.useMemo<MultiSelectContextValue>(
    () => ({
      values: current,
      setValues,
      open,
      setOpen,
      inputValue,
      setInputValue,
      activeIndex,
      setActiveIndex,
      disabled,
    }),
    [current, setValues, open, inputValue, activeIndex, disabled]
  );

  return (
    <MultiSelectContext.Provider value={ctx}>
      <Command
        onKeyDown={onKeyDown}
        className={cn(
          'overflow-visible bg-transparent flex flex-col gap-2',
          className
        )}
      >
        {children}
      </Command>
    </MultiSelectContext.Provider>
  );
}

/* ---------------------------------- Trigger -------------------------------- */

export type MultiSelectorTriggerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  children?: React.ReactNode;
  placeholder?: string;
  /** Custom render για κάθε tag */
  renderTag?: (
    value: string,
    remove: () => void,
    isActive: boolean
  ) => React.ReactNode;
  /** Εναλλακτικό mapping: value -> label */
  renderTagLabel?: (value: string) => React.ReactNode;
  labelMap?: Map<string, React.ReactNode> | Record<string, React.ReactNode>;
  /** Εικονίδιο καθαρισμού όλων */
  clearable?: boolean;
  onClearAll?: () => void;
};

export const MultiSelectorTrigger = React.forwardRef<
  HTMLDivElement,
  MultiSelectorTriggerProps
>(function Trigger(
  {
    className,
    children,
    placeholder = 'Επιλογή...',
    renderTag,
    renderTagLabel,
    labelMap,
    clearable = true,
    onClearAll,
    ...props
  },
  ref
) {
  const { values, setValues, activeIndex, setActiveIndex, setOpen, disabled } =
    useMultiSelectCtx();

  const remove = (val: string) => setValues(values.filter((v) => v !== val));
  const clearAll = () => {
    setValues([]);
    onClearAll?.();
  };

  const getTagDisplay = (val: string): React.ReactNode => {
    if (typeof renderTagLabel === 'function') return renderTagLabel(val);
    if (labelMap) {
      if (labelMap instanceof Map) return labelMap.get(val) ?? val;
      if (typeof labelMap === 'object')
        return (labelMap as Record<string, React.ReactNode>)[val] ?? val;
    }
    return val;
  };

  const preventMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={ref}
      className={cn(
        'w-full min-h-10 rounded-md border bg-background px-2 py-1.5',
        'flex flex-wrap items-center gap-1',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
      onClick={() => {
        setActiveIndex?.(-1);
        setOpen(true);
      }}
      {...props}
    >
      {values.length === 0 && (
        <span className='text-sm text-muted-foreground mx-1'>
          {placeholder}
        </span>
      )}

      {values.map((val, idx) =>
        typeof renderTag === 'function' ? (
          <span key={val} onMouseDown={preventMouseDown}>
            {renderTag(val, () => remove(val), activeIndex === idx)}
          </span>
        ) : (
          <Badge
            key={val}
            variant='secondary'
            className={cn(
              'px-2 py-0.5 rounded-xl flex items-center gap-1 text-xs',
              activeIndex === idx && 'ring-2 ring-muted-foreground'
            )}
            onMouseDown={preventMouseDown}
          >
            {getTagDisplay(val)}
            <button
              type='button'
              aria-label={`Αφαίρεση ${val}`}
              className='hover:text-destructive'
              onMouseDown={preventMouseDown}
              onClick={() => remove(val)}
            >
              <X className='h-3.5 w-3.5' />
            </button>
          </Badge>
        )
      )}

      {children}

      {clearable && values.length > 0 && (
        <button
          type='button'
          className='ml-auto text-muted-foreground hover:text-foreground p-1'
          onMouseDown={preventMouseDown}
          onClick={clearAll}
          aria-label='Καθαρισμός'
        >
          <X className='h-4 w-4' />
        </button>
      )}
    </div>
  );
});

/* ----------------------------------- Input --------------------------------- */

// ✅ Χρησιμοποίησε τα props του cmdk Input και αφαίρεσε value/onValueChange
export type MultiSelectorInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
  'value' | 'onValueChange'
> & {
  className?: string;
};

export const MultiSelectorInput = React.forwardRef<
  HTMLInputElement,
  MultiSelectorInputProps
>(function Input({ className, ...props }, ref) {
  const { setOpen, inputValue, setInputValue, activeIndex, setActiveIndex } =
    useMultiSelectCtx();

  return (
    <CommandPrimitive.Input
      ref={ref}
      value={inputValue} // always string ✅
      onValueChange={activeIndex === -1 ? setInputValue : undefined}
      onBlur={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onClick={() => setActiveIndex(-1)}
      className={cn(
        'ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm',
        activeIndex !== -1 && 'caret-transparent',
        className
      )}
      {...props} // δεν περιέχει "value" πλέον ✅
    />
  );
});

/* --------------------------------- Content/List ---------------------------- */

export type MultiSelectorContentProps = React.HTMLAttributes<HTMLDivElement>;

export const MultiSelectorContent = React.forwardRef<
  HTMLDivElement,
  MultiSelectorContentProps
>(function Content({ className, children, ...props }, ref) {
  const { open } = useMultiSelectCtx();
  return (
    <div ref={ref} className={cn('relative', className)} {...props}>
      {open && children}
    </div>
  );
});

export type MultiSelectorListProps = React.ComponentPropsWithoutRef<
  typeof CommandList
>;

export const MultiSelectorList = React.forwardRef<
  HTMLDivElement,
  MultiSelectorListProps
>(function List({ className, children, ...props }, ref) {
  return (
    <CommandList
      ref={ref}
      className={cn(
        'absolute left-0 right-0 top-full mt-1 w-full',
        'max-h-64 overflow-auto rounded-md border bg-popover shadow-md z-50',
        'scrollbar-thin scrollbar-thumb-muted-foreground/50 hover:scrollbar-thumb-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </CommandList>
  );
});

/* ------------------------------------ Item --------------------------------- */

export type MultiSelectorItemProps = Omit<
  React.ComponentPropsWithoutRef<typeof CommandItem>,
  'value' | 'onSelect'
> & {
  value: string; // cmdk value
  disabled?: boolean;
};

export const MultiSelectorItem = React.forwardRef<
  HTMLDivElement,
  MultiSelectorItemProps
>(function Item({ className, children, value, disabled, ...props }, ref) {
  const { values, setValues, setInputValue } = useMultiSelectCtx();
  const included = values.includes(value);

  const toggle = () => {
    if (disabled) return;
    setValues(
      included ? values.filter((v) => v !== value) : [...values, value]
    );
    setInputValue('');
  };

  return (
    <CommandItem
      ref={ref}
      {...props}
      value={value}
      className={cn(
        'flex items-center justify-between px-2 py-1.5 text-sm rounded-md cursor-pointer',
        'data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
        included && 'opacity-70',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onSelect={toggle}
      onMouseDown={(e) => e.preventDefault()} // κράτα focus, μην κλείνεις
    >
      <span>{children}</span>
      {included && <Check className='h-4 w-4' />}
    </CommandItem>
  );
});

/* ------------------------------------ Footer --------------------------------- */

export type MultiSelectorFooterActionProps = {
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function MultiSelectorFooterAction({
  onClick,
  className,
  children,
}: MultiSelectorFooterActionProps): React.JSX.Element {
  const { setOpen } = useMultiSelectCtx();

  return (
    <div
      role='button'
      tabIndex={0}
      className={cn(
        'mt-1 border-t px-3 py-2 text-sm cursor-pointer hover:bg-muted',
        className
      )}
      onMouseDown={(e) => e.preventDefault()} // μην χαθεί το focus
      onClick={() => {
        setOpen?.(false);
        setTimeout(() => {
          const el = document.activeElement as HTMLElement | null;
          el?.blur?.();
          onClick?.();
        }, 0);
      }}
    >
      {children}
    </div>
  );
}
