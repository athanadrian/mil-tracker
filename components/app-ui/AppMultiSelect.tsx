'use client';

import * as React from 'react';
import { Controller } from 'react-hook-form';
import type {
  Control,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from 'react-hook-form';

import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
  MultiSelectorFooterAction,
} from '@/components/ui/multi-select';
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
} from '@/components/ui/command';
import { AppErrorMessage, AppIcon } from '@/components/app-ui';
import type { IconLike } from '@/components/app-ui';
import { cn } from '@/lib/utils';

const toStr = (v: unknown): string => (v == null ? '' : String(v));

/** Απλά typings για errors από φορμα/εξωτερικές πηγές */
type SimpleError = string | { message?: string } | undefined;

export type AppMultiSelectProps<TOption = any> = {
  label?: React.ReactNode;
  className?: string;
  options?: readonly TOption[];

  /** Controlled */
  value?: string[];
  onChange?: (vals: string[]) => void;

  /** Uncontrolled default */
  defaultValue?: string[];

  placeholder?: string;
  disabled?: boolean;

  /** Ετικέτα option */
  getOptionLabel?: (o: TOption) => React.ReactNode;
  /** Value option (θα μετατραπεί σε string) */
  getOptionValue?: (o: TOption) => string | number | null | undefined;

  /** Μήνυμα λάθους (string) */
  error?: SimpleError;

  /** Αναζήτηση */
  inputPlaceholder?: string;

  /** Δράση “Προσθήκη νέου …” */
  onAdd?: () => void;
  addLabel?: React.ReactNode;
  addIcon?: IconLike | React.ReactElement;

  /** Radix portal container (αν χρειάζεται) */
  portalContainer?: HTMLElement | null;
};

function AppMultiSelect<TOption = any>({
  label,
  className,
  options = [],
  value,
  defaultValue = [],
  onChange,
  placeholder = 'Επιλογή…',
  disabled,
  getOptionLabel = (o: any) =>
    o?.label ?? o?.name ?? o?.title ?? o?.value ?? String(o),
  getOptionValue = (o: any) => o?.id ?? o?.value ?? '',
  error,
  inputPlaceholder = 'Αναζήτηση…',
  onAdd,
  addLabel = 'Προσθήκη νέου…',
  addIcon,
  portalContainer,
}: AppMultiSelectProps<TOption>): React.JSX.Element {
  const [uncontrolled, setUncontrolled] =
    React.useState<string[]>(defaultValue);

  // controlled/uncontrolled bridge
  const values = value ?? uncontrolled;
  const setValues = (next: string[]) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  /**
   * Κανονικοποίηση options:
   * - Υπολογίζουμε val = String(getOptionValue(o)) μόνο αν είναι truthy (όχι null/undefined/'').
   * - Αγνοούμε options χωρίς έγκυρο value.
   * - Αγνοούμε διπλότυπα values.
   */
  const normalized = React.useMemo<
    { val: string; label: React.ReactNode; option: TOption }[]
  >(() => {
    const seen = new Set<string>();
    const arr: { val: string; label: React.ReactNode; option: TOption }[] = [];

    for (const o of options) {
      const raw = getOptionValue(o as TOption);
      if (raw === null || raw === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('AppMultiSelect: option without value ->', o);
        }
        continue;
      }
      const val = toStr(raw);
      if (!val) continue;
      if (seen.has(val)) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('AppMultiSelect: duplicate option value ->', val, o);
        }
        continue;
      }
      seen.add(val);
      arr.push({
        val,
        label: getOptionLabel(o as TOption),
        option: o as TOption,
      });
    }
    return arr;
  }, [options, getOptionLabel, getOptionValue]);

  // Map για γρήγορο label lookup (για τα tags στο Trigger)
  const labelMap = React.useMemo(() => {
    const m = new Map<string, React.ReactNode>();
    for (const it of normalized) m.set(it.val, it.label);
    return m;
  }, [normalized]);

  const errorMsg = typeof error === 'string' ? error : error?.message ?? '';

  // Κάποιες εκδόσεις του shadcn Select/Multi δεν τυπώνουν το prop "container"
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className='text-sm font-medium'>{label}</label>}

      <MultiSelector
        values={values}
        onValuesChange={setValues}
        disabled={disabled}
      >
        <MultiSelectorTrigger placeholder={placeholder} labelMap={labelMap}>
          <MultiSelectorInput placeholder='' />
        </MultiSelectorTrigger>

        {/* ts-expect-error ορισμένες εκδόσεις δεν εκθέτουν type για "container" */}

        <MultiSelectorContent {...contentProps}>
          <CommandInput placeholder={inputPlaceholder} />
          <MultiSelectorList>
            <CommandEmpty>Δεν βρέθηκαν επιλογές.</CommandEmpty>

            <CommandGroup>
              {normalized.map(({ val, label }) => (
                <MultiSelectorItem key={`opt-${val}`} value={val}>
                  {label}
                </MultiSelectorItem>
              ))}
            </CommandGroup>

            {typeof onAdd === 'function' && (
              <MultiSelectorFooterAction
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  requestAnimationFrame(() => onAdd());
                }}
              >
                <div className='flex items-center gap-2'>
                  {addIcon ? (
                    <AppIcon icon={addIcon} />
                  ) : (
                    <span className='text-base'>＋</span>
                  )}
                  <span>{addLabel}</span>
                </div>
              </MultiSelectorFooterAction>
            )}
          </MultiSelectorList>
        </MultiSelectorContent>
      </MultiSelector>

      {errorMsg ? <AppErrorMessage message={errorMsg} /> : null}
    </div>
  );
}

export default AppMultiSelect;

/* ================= RHF wrapper ================= */

export type AppMultiSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TOption = any
> = Omit<AppMultiSelectProps<TOption>, 'value' | 'onChange' | 'error'> & {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  /** Προώθηση τυχόν error string (fallback πέρα από RHF) */
  externalError?: string;
};

export function AppMultiSelectField<
  TFieldValues extends FieldValues = FieldValues,
  TOption = any
>({
  control,
  name,
  rules,
  externalError,
  ...rest
}: AppMultiSelectFieldProps<TFieldValues, TOption>): React.JSX.Element {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <AppMultiSelect<TOption>
          {...rest}
          value={Array.isArray(field.value) ? (field.value as string[]) : []}
          onChange={field.onChange}
          error={fieldState.error?.message ?? externalError}
        />
      )}
    />
  );
}
