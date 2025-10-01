// 'use client';

// import React, { memo, useMemo } from 'react';
// import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectTrigger,
//   SelectContent,
//   SelectItem,
//   SelectValue,
// } from '@/components/ui/select';
// import { AppIcon } from '@/components/app-ui';
// import { appIcons } from '@/constants/app-icons';
// import { AppSelect } from '@/components/app-ui';

// const CLEAR_TOKEN = '__CLEAR__' as const;

// /* -------------------------------------------------------------------------- */
// /*                                   Types                                    */
// /* -------------------------------------------------------------------------- */
// export type FiltersRecord = Record<string, string>;

// export type BaseFilterItem = {
//   key: string;
//   className?: string;
//   width?: number | string;
//   placeholder?: string;
//   includeClear?: boolean; // default true
//   clearLabel?: string; // default "Όλα"
//   disabled?:
//     | boolean
//     | ((ctx: { filters: FiltersRecord; value: string }) => boolean);
// };

// export type TextFilterItem = BaseFilterItem & {
//   type: 'text';
// };

// export type SelectOption = { value: string | number; label: string };
// export type SelectFilterItem = BaseFilterItem & {
//   type: 'select';
//   options?: SelectOption[];
// };

// export type AppSelectOption = { id: string; label: string } & Record<
//   string,
//   unknown
// >;
// export type AppSelectFilterItem = BaseFilterItem & {
//   type: 'appselect';
//   options?: AppSelectOption[]; // raw options (AppSelect supports arbitrary shapes)
//   getLabel?: (opt: AppSelectOption) => string;
// };

// export type CustomFilterRenderArgs = {
//   value: string;
//   setValue: (v: string) => void;
//   filters: FiltersRecord;
//   setField: (key: string, v: string) => void;
// };
// export type CustomFilterItem = BaseFilterItem & {
//   type: 'custom';
//   render?: (args: CustomFilterRenderArgs) => React.ReactNode;
// };

// export type FilterItem =
//   | TextFilterItem
//   | SelectFilterItem
//   | AppSelectFilterItem
//   | CustomFilterItem;

// export type FiltersContainerProps = {
//   schema?: FilterItem[];
//   filters?: FiltersRecord;
//   onChange?: (delta: FiltersRecord) => void;
//   onClearAll?: () => void;
//   endSlot?: React.ReactNode;
//   className?: string;
//   clearLabel?: string;
// };

// /* -------------------------------------------------------------------------- */
// /*                                Component                                   */
// /* -------------------------------------------------------------------------- */
// const FiltersContainer = memo(function FiltersContainer({
//   schema = [],
//   filters = {},
//   onChange,
//   onClearAll,
//   endSlot = null,
//   className = '',
//   clearLabel = 'Καθαρισμός',
// }: FiltersContainerProps) {
//   const hasActive = useMemo(
//     () => Object.values(filters || {}).some((v) => !!v),
//     [filters]
//   );

//   const setField = (key: string, value: string | undefined) => {
//     onChange?.({ [key]: value ?? '' });
//   };

//   const isItemDisabled = (item: FilterItem, value: string) =>
//     typeof item.disabled === 'function'
//       ? !!item.disabled({ filters, value })
//       : !!item.disabled;

//   // χωρίζουμε text vs λοιπά controls
//   const textItems = schema.filter(
//     (s): s is TextFilterItem => s.type === 'text'
//   );
//   const otherItems = schema.filter((s) => s.type !== 'text');

//   // ---------- RENDER HELPERS ----------
//   type Variant = 'mobile' | 'desktop';

//   const renderTextItem = (item: TextFilterItem, variant: Variant) => {
//     const value = filters?.[item.key] ?? '';
//     const isDisabled = isItemDisabled(item, value);
//     const style =
//       variant === 'desktop' && item.width
//         ? {
//             width:
//               typeof item.width === 'number' ? `${item.width}px` : item.width,
//           }
//         : undefined;

//     return (
//       <div
//         key={item.key}
//         className={cn(variant === 'mobile' ? 'w-full' : '', item.className)}
//         style={style}
//       >
//         <div className='relative flex'>
//           <AppIcon
//             icon={appIcons.search}
//             size={16}
//             className='pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground'
//           />
//           <Input
//             placeholder={item.placeholder || ''}
//             value={value}
//             onChange={(e) => setField(item.key, e.target.value)}
//             disabled={isDisabled}
//             className='pl-8 h-9'
//           />
//         </div>
//       </div>
//     );
//   };

//   const renderSelectItem = (item: SelectFilterItem, variant: Variant) => {
//     const value = filters?.[item.key] ?? '';
//     const isDisabled = isItemDisabled(item, value);
//     const style =
//       variant === 'desktop' && item.width
//         ? {
//             width:
//               typeof item.width === 'number' ? `${item.width}px` : item.width,
//           }
//         : undefined;

//     const opts = (item.options || []).filter(
//       (opt) => String(opt?.value ?? '').length > 0
//     );

//     return (
//       <div
//         key={item.key}
//         className={cn(
//           variant === 'mobile' ? 'w-full' : 'w-[200px]',
//           item.className
//         )}
//         style={style}
//       >
//         <Select
//           value={value}
//           onValueChange={(v) => setField(item.key, v === CLEAR_TOKEN ? '' : v)}
//           disabled={isDisabled}
//         >
//           <SelectTrigger className='h-9'>
//             <SelectValue placeholder={item.placeholder || '—'} />
//           </SelectTrigger>
//           <SelectContent>
//             {item.includeClear !== false && (
//               <SelectItem value={CLEAR_TOKEN}>
//                 {' '}
//                 {item.clearLabel || 'Όλα'}{' '}
//               </SelectItem>
//             )}
//             {opts.map((opt) => (
//               <SelectItem key={String(opt.value)} value={String(opt.value)}>
//                 {opt.label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>
//     );
//   };

//   const renderAppSelectItem = (item: AppSelectFilterItem, variant: Variant) => {
//     const value = filters?.[item.key] ?? '';
//     const isDisabled = isItemDisabled(item, value);
//     const style =
//       variant === 'desktop' && item.width
//         ? {
//             width:
//               typeof item.width === 'number' ? `${item.width}px` : item.width,
//           }
//         : undefined;

//     const appOptions: AppSelectOption[] =
//       item.includeClear !== false
//         ? [
//             {
//               id: CLEAR_TOKEN,
//               label: item.clearLabel || 'Όλα',
//               __clear: true,
//             } as AppSelectOption,
//             ...(item.options || []),
//           ]
//         : item.options || [];

//     const getLabel = (opt: AppSelectOption) =>
//       (opt as any)?.__clear
//         ? item.clearLabel || 'Όλα'
//         : item.getLabel?.(opt) ?? String((opt as any)?.label ?? '');

//     return (
//       <div
//         key={item.key}
//         className={cn(
//           variant === 'mobile' ? 'w-full' : 'w-[200px]',
//           item.className
//         )}
//         style={style}
//       >
//         <AppSelect
//           value={value}
//           onChange={(v: string) =>
//             setField(item.key, v === CLEAR_TOKEN ? '' : v)
//           }
//           options={appOptions as any}
//           placeholder={item.placeholder || item.clearLabel || 'Όλα'}
//           showSelect
//           getLabel={getLabel as any}
//           disabled={isDisabled}
//           className='h-9'
//         />
//       </div>
//     );
//   };

//   const renderCustomItem = (item: CustomFilterItem, variant: Variant) => {
//     const value = filters?.[item.key] ?? '';
//     const style =
//       variant === 'desktop' && item.width
//         ? {
//             width:
//               typeof item.width === 'number' ? `${item.width}px` : item.width,
//           }
//         : undefined;
//     return (
//       <div
//         key={item.key}
//         className={cn(variant === 'mobile' ? 'w-full' : '', item.className)}
//         style={style}
//       >
//         {item.render?.({
//           value,
//           setValue: (v) => setField(item.key, v),
//           filters,
//           setField,
//         })}
//       </div>
//     );
//   };

//   const renderItem = (item: FilterItem, variant: Variant) => {
//     if (item.type === 'text') return renderTextItem(item, variant);
//     if (item.type === 'select') return renderSelectItem(item, variant);
//     if (item.type === 'appselect') return renderAppSelectItem(item, variant);
//     if (item.type === 'custom') return renderCustomItem(item, variant);
//     return null;
//   };

//   return (
//     <div className={cn('rounded-md border bg-muted/30', className)}>
//       {/* MOBILE / SMALL (md:hidden) */}
//       <div className='md:hidden px-3 py-2 space-y-2'>
//         {/* 1) Text inputs row (πάνω, full-width) */}
//         <div className='w-full space-y-2'>
//           {textItems.length > 0
//             ? textItems.map((it) => renderItem(it, 'mobile'))
//             : null}
//         </div>

//         {/* 2) Other controls κάτω: 1 στήλη σε xs, 2 στήλες από sm και πάνω */}
//         <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
//           {otherItems.map((it) => renderItem(it, 'mobile'))}
//         </div>

//         {/* 3) End slot + Clear */}
//         <div className='flex items-center gap-2 pt-1'>
//           {endSlot}
//           {hasActive && (
//             <Button
//               variant='ghost'
//               size='sm'
//               className='ml-auto h-8'
//               onClick={() => onClearAll?.()}
//             >
//               <AppIcon icon={appIcons.delete} size={14} className='mr-1' />
//               {clearLabel}
//             </Button>
//           )}
//         </div>
//       </div>

//       {/* DESKTOP (md+) */}
//       <div className='hidden md:flex flex-wrap items-center gap-2 px-3 py-2'>
//         {schema.map((item) => renderItem(item, 'desktop'))}
//         {endSlot}
//         {hasActive && (
//           <Button
//             variant='ghost'
//             size='sm'
//             className='ml-auto h-7'
//             onClick={() => onClearAll?.()}
//           >
//             <AppIcon icon={appIcons.delete} size={14} className='mr-1' />
//             {clearLabel}
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// });

// export default FiltersContainer;
'use client';

import React, { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { AppIcon } from '@/components/app-ui';
import { appIcons } from '@/constants/app-icons';
import { AppSelect } from '@/components/app-ui';

const CLEAR_TOKEN = '__CLEAR__' as const;

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */
export type FiltersRecord = Record<string, string>;

export type BaseFilterItem = {
  key: string;
  className?: string;
  width?: number | string;
  placeholder?: string;
  includeClear?: boolean; // default true
  clearLabel?: string; // default "Όλα"
  disabled?:
    | boolean
    | ((ctx: { filters: FiltersRecord; value: string }) => boolean);
};

export type TextFilterItem = BaseFilterItem & {
  type: 'text';
};

export type SelectOption = { value: string | number; label: string };
export type SelectFilterItem = BaseFilterItem & {
  type: 'select';
  options?: SelectOption[];
};

export type AppSelectOption = { id: string; label: string } & Record<
  string,
  unknown
>;
export type AppSelectFilterItem = BaseFilterItem & {
  type: 'appselect';
  options?: AppSelectOption[]; // raw options (AppSelect supports arbitrary shapes)
  getLabel?: (opt: AppSelectOption) => string;
};

export type CustomFilterRenderArgs = {
  value: string;
  setValue: (v: string) => void;
  filters: FiltersRecord;
  setField: (key: string, v: string) => void;
};
export type CustomFilterItem = BaseFilterItem & {
  type: 'custom';
  render?: (args: CustomFilterRenderArgs) => React.ReactNode;
};

export type FilterItem =
  | TextFilterItem
  | SelectFilterItem
  | AppSelectFilterItem
  | CustomFilterItem;

export type FiltersBarProps = {
  schema?: FilterItem[];
  filters?: FiltersRecord;
  onChange?: (delta: FiltersRecord) => void;
  onClearAll?: () => void;
  endSlot?: React.ReactNode;
  className?: string;
  clearLabel?: string;
};

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */
const FiltersBar = memo(function FiltersBar({
  schema = [],
  filters = {},
  onChange,
  onClearAll,
  endSlot = null,
  className = '',
  clearLabel = 'Καθαρισμός',
}: FiltersBarProps) {
  const hasActive = useMemo(
    () => Object.values(filters || {}).some((v) => !!v),
    [filters]
  );

  const setField = (key: string, value: string | undefined) => {
    onChange?.({ [key]: value ?? '' });
  };

  const isItemDisabled = (item: FilterItem, value: string) =>
    typeof item.disabled === 'function'
      ? !!item.disabled({ filters, value })
      : !!item.disabled;

  // χωρίζουμε text vs λοιπά controls
  const textItems = schema.filter(
    (s): s is TextFilterItem => s.type === 'text'
  );
  const otherItems = schema.filter((s) => s.type !== 'text');

  // ---------- RENDER HELPERS ----------
  type Variant = 'mobile' | 'desktop';

  const renderTextItem = (item: TextFilterItem, variant: Variant) => {
    const value = filters?.[item.key] ?? '';
    const isDisabled = isItemDisabled(item, value);
    const style =
      variant === 'desktop' && item.width
        ? {
            width:
              typeof item.width === 'number' ? `${item.width}px` : item.width,
          }
        : undefined;

    return (
      <div
        key={item.key}
        className={cn(variant === 'mobile' ? 'w-full' : '', item.className)}
        style={style}
      >
        <div className='relative flex'>
          <AppIcon
            icon={appIcons.search}
            size={16}
            className='pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground'
          />
          <Input
            placeholder={item.placeholder || ''}
            value={value}
            onChange={(e) => setField(item.key, e.target.value)}
            disabled={isDisabled}
            className='pl-8 h-9'
          />
        </div>
      </div>
    );
  };

  const renderSelectItem = (item: SelectFilterItem, variant: Variant) => {
    const value = filters?.[item.key] ?? '';
    const isDisabled = isItemDisabled(item, value);
    const style =
      variant === 'desktop' && item.width
        ? {
            width:
              typeof item.width === 'number' ? `${item.width}px` : item.width,
          }
        : undefined;

    const opts = (item.options || []).filter(
      (opt) => String(opt?.value ?? '').length > 0
    );

    return (
      <div
        key={item.key}
        className={cn(
          variant === 'mobile' ? 'w-full' : 'w-[200px]',
          item.className
        )}
        style={style}
      >
        <Select
          value={value}
          onValueChange={(v) => setField(item.key, v === CLEAR_TOKEN ? '' : v)}
          disabled={isDisabled}
        >
          <SelectTrigger className='h-9'>
            <SelectValue placeholder={item.placeholder || '—'} />
          </SelectTrigger>
          <SelectContent>
            {item.includeClear !== false && (
              <SelectItem value={CLEAR_TOKEN}>
                {' '}
                {item.clearLabel || 'Όλα'}{' '}
              </SelectItem>
            )}
            {opts.map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderAppSelectItem = (item: AppSelectFilterItem, variant: Variant) => {
    const value = filters?.[item.key] ?? '';
    const isDisabled = isItemDisabled(item, value);
    const style =
      variant === 'desktop' && item.width
        ? {
            width:
              typeof item.width === 'number' ? `${item.width}px` : item.width,
          }
        : undefined;

    // Ensure every option has id/label, and prepend a CLEAR option if requested
    const normalized: AppSelectOption[] = (item.options || []).map(
      (o: any) => ({
        id: String(o?.id ?? o?.value ?? ''),
        label: String(o?.label ?? ''),
        ...o,
      })
    );

    const appOptions: AppSelectOption[] =
      item.includeClear !== false
        ? [
            {
              id: CLEAR_TOKEN,
              label: item.clearLabel || 'Όλα',
              __clear: true,
            } as AppSelectOption,
            ...normalized,
          ]
        : normalized;

    const getLabel = (opt: AppSelectOption) =>
      (opt as any)?.__clear
        ? item.clearLabel || 'Όλα'
        : item.getLabel?.(opt) ?? String((opt as any)?.label ?? '');

    // Be robust to AppSelect implementations that return either the id string OR the whole option object
    const handleChange = (v: any) => {
      const raw = typeof v === 'string' ? v : v?.id ?? v?.value ?? '';
      const next = raw === CLEAR_TOKEN ? '' : String(raw ?? '');
      setField(item.key, next);
    };

    return (
      <div
        key={item.key}
        className={cn(
          variant === 'mobile' ? 'w-full' : 'w-[200px]',
          item.className
        )}
        style={style}
      >
        <AppSelect
          value={value}
          onChange={handleChange}
          options={appOptions as any}
          placeholder={item.placeholder || item.clearLabel || 'Όλα'}
          showSelect
          getLabel={getLabel as any}
          disabled={isDisabled}
          className='h-9'
        />
      </div>
    );
  };

  const renderCustomItem = (item: CustomFilterItem, variant: Variant) => {
    const value = filters?.[item.key] ?? '';
    const style =
      variant === 'desktop' && item.width
        ? {
            width:
              typeof item.width === 'number' ? `${item.width}px` : item.width,
          }
        : undefined;
    return (
      <div
        key={item.key}
        className={cn(variant === 'mobile' ? 'w-full' : '', item.className)}
        style={style}
      >
        {item.render?.({
          value,
          setValue: (v) => setField(item.key, v),
          filters,
          setField,
        })}
      </div>
    );
  };

  const renderItem = (item: FilterItem, variant: Variant) => {
    if (item.type === 'text') return renderTextItem(item, variant);
    if (item.type === 'select') return renderSelectItem(item, variant);
    if (item.type === 'appselect') return renderAppSelectItem(item, variant);
    if (item.type === 'custom') return renderCustomItem(item, variant);
    return null;
  };

  return (
    <div className={cn('rounded-md border bg-muted/30', className)}>
      {/* MOBILE / SMALL (md:hidden) */}
      <div className='md:hidden px-3 py-2 space-y-2'>
        {/* 1) Text inputs row (πάνω, full-width) */}
        <div className='w-full space-y-2'>
          {textItems.length > 0
            ? textItems.map((it) => renderItem(it, 'mobile'))
            : null}
        </div>

        {/* 2) Other controls κάτω: 1 στήλη σε xs, 2 στήλες από sm και πάνω */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
          {otherItems.map((it) => renderItem(it, 'mobile'))}
        </div>

        {/* 3) End slot + Clear */}
        <div className='flex items-center gap-2 pt-1'>
          {endSlot}
          {hasActive && (
            <Button
              variant='ghost'
              size='sm'
              className='ml-auto h-8'
              onClick={() => onClearAll?.()}
            >
              <AppIcon icon={appIcons.delete} size={14} className='mr-1' />
              {clearLabel}
            </Button>
          )}
        </div>
      </div>

      {/* DESKTOP (md+) */}
      <div className='hidden md:flex flex-wrap items-center gap-2 px-3 py-2'>
        {schema.map((item) => renderItem(item, 'desktop'))}
        {endSlot}
        {hasActive && (
          <Button
            variant='ghost'
            size='sm'
            className='ml-auto h-7'
            onClick={() => onClearAll?.()}
          >
            <AppIcon icon={appIcons.delete} size={14} className='mr-1' />
            {clearLabel}
          </Button>
        )}
      </div>
    </div>
  );
});

export default FiltersBar;
