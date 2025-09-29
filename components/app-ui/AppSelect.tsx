'use client';

import * as React from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { AppErrorMessage, AppIcon } from '.';
import type { IconLike } from '.';

type SimpleFieldError = { message?: string } | string;
type ErrorsMap = Record<string, SimpleFieldError | undefined>;

const toStr = (v: unknown): string => (v == null ? '' : String(v));

export type AppSelectProps<TOption = any> = {
  label?: React.ReactNode;
  /** Όνομα πεδίου (αν δουλεύεις με RHF getValues/setValue) */
  name?: string;
  options?: readonly TOption[];

  /** Αν θες να “πορτάρεις” το dropdown αλλού (Radix Portal container) */
  portalContainer?: HTMLElement | null;

  /** Controlled value (string/number) */
  value?: string | number | null;
  onChange?: (val: string) => void;

  /** RHF-like helpers (προαιρετικά) */
  getValues?: (name: string) => unknown;
  setValue?: (
    name: string,
    val: string,
    opts?: { shouldValidate?: boolean }
  ) => void;
  errors?: ErrorsMap;

  placeholder?: string;
  disabled?: boolean;
  showSelect?: boolean;
  className?: string;

  /** Πώς παράγεται το text label κάθε option */
  getLabel?: (item: TOption) => React.ReactNode;
  /** Πώς παράγεται η τιμή (value) κάθε option */
  getOptionValue?: (item: TOption) => string | number;

  /** Custom renderers */
  renderOption?: (item: TOption) => React.ReactNode;
  renderTriggerValue?: (item: TOption) => React.ReactNode;

  /** “Προσθήκη νέου …” */
  onAdd?: () => void;
  addLabel?: React.ReactNode;
  addIcon?: IconLike | React.ReactElement;
};

function AppSelect<TOption = any>({
  label,
  name,
  options = [],
  portalContainer,
  value,
  onChange,
  getValues,
  setValue,
  errors,
  placeholder = 'Επιλογή',
  disabled,
  showSelect = true,
  getLabel = (item: any) =>
    item?.label ?? item?.name ?? item?.title ?? item?.value,
  className,
  renderOption,
  renderTriggerValue,
  getOptionValue = (item: any) => item?.id ?? item?.value,
  onAdd,
  addLabel,
  addIcon,
}: AppSelectProps<TOption>): React.JSX.Element | null {
  const [open, setOpen] = React.useState(false);

  // Επιλεγμένη τιμή (προτεραιότητα σε RHF getValues αν δώσεις name)
  const selectedRaw =
    typeof getValues === 'function' && name ? getValues(name) : value;
  const selectedValue = toStr(selectedRaw);

  const selectedItem = React.useMemo(
    () =>
      options.find(
        (it) => toStr(getOptionValue(it as TOption)) === selectedValue
      ) as TOption | undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options, selectedValue]
  );

  const handleChange = (val: string) => {
    if (typeof setValue === 'function' && name) {
      setValue(name, val, { shouldValidate: true });
    } else if (typeof onChange === 'function') {
      onChange(val);
    }
    setOpen(false);
  };

  const triggerContent = React.useMemo(() => {
    if (!selectedItem) return null;
    return typeof renderTriggerValue === 'function'
      ? renderTriggerValue(selectedItem)
      : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, renderTriggerValue]);

  if (!showSelect) return null;

  const errorMessage =
    name && errors?.[name]
      ? typeof errors[name] === 'string'
        ? (errors[name] as string)
        : (errors[name] as { message?: string })?.message ?? ''
      : '';

  // Το shadcn SelectContent μπορεί να μην έχει "container" type.
  // Το περνάμε conditionally για να αποφύγουμε TS error.
  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      {label && <label className='text-sm font-medium'>{label}</label>}

      <Select
        open={open}
        onOpenChange={setOpen}
        value={selectedValue}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger>
          {triggerContent ? (
            <div className='truncate'>{triggerContent}</div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        /* @ts-expect-error: ορισμένες εκδόσεις shadcn/Select δεν τυπώνουν το
        "container" */
        <SelectContent {...contentProps}>
          {options.map((item) => {
            const val = toStr(getOptionValue(item as TOption));
            const labelText = getLabel(item as TOption);
            return (
              <SelectItem
                key={val}
                value={val}
                textValue={
                  typeof labelText === 'string' ? labelText : String(labelText)
                }
              >
                {typeof renderOption === 'function'
                  ? renderOption(item as TOption)
                  : labelText}
              </SelectItem>
            );
          })}

          {typeof onAdd === 'function' && (
            <div
              role='button'
              tabIndex={0}
              className='mt-1 border-t pt-2 px-3 text-sm cursor-pointer hover:bg-muted flex items-center gap-2'
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                requestAnimationFrame(() => {
                  const ae = document.activeElement;
                  if (ae instanceof HTMLElement) ae.blur();
                  onAdd();
                });
              }}
            >
              {addIcon ? <AppIcon icon={addIcon} /> : <span>+</span>}
              <span>{addLabel || 'Προσθήκη νέου...'}</span>
            </div>
          )}
        </SelectContent>
      </Select>

      {errorMessage ? <AppErrorMessage message={errorMessage} /> : null}
    </div>
  );
}

export default AppSelect;
