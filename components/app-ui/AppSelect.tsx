// AppSelect.tsx
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

// sentinel για “Προσθήκη νέου…”
const ADD_TOKEN = '__APPSELECT_ADD__';

export type AppSelectProps<
  TOption = any,
  TFieldName extends string = string
> = {
  label?: React.ReactNode;
  name?: TFieldName;
  options?: readonly TOption[];

  portalContainer?: HTMLElement | null;

  value?: string | number | null;
  onChange?: (val: string) => void;

  getValues?: (name: TFieldName) => unknown;
  setValue?: (
    name: TFieldName,
    val: any,
    opts?: { shouldValidate?: boolean }
  ) => void;
  errors?: ErrorsMap;

  placeholder?: string;
  disabled?: boolean;
  showSelect?: boolean;
  className?: string;

  getLabel?: (item: TOption) => React.ReactNode;
  getOptionValue?: (item: TOption) => string | number;

  renderOption?: (item: TOption) => React.ReactNode;
  renderTriggerValue?: (item: TOption) => React.ReactNode;

  onAdd?: () => void;
  addLabel?: React.ReactNode;
  addIcon?: IconLike | React.ReactElement;
};

function AppSelect<TOption = any, TFieldName extends string = string>({
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
}: AppSelectProps<TOption, TFieldName>): React.JSX.Element | null {
  const [open, setOpen] = React.useState(false);

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

  const applyChange = (val: string) => {
    if (typeof setValue === 'function' && name) {
      setValue(name, val, { shouldValidate: true });
    } else if (typeof onChange === 'function') {
      onChange(val);
    }
    setOpen(false);
  };

  // Τυλίγουμε το onValueChange ώστε να πιάσουμε το ADD_TOKEN
  const handleValueChange = (val: string) => {
    if (onAdd && val === ADD_TOKEN) {
      setOpen(false);
      // δώσε χρόνο να κλείσει το dropdown πριν ανοίξεις άλλο dialog
      requestAnimationFrame(() => onAdd());
      return;
    }
    applyChange(val);
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
    name && errors?.[name as string]
      ? typeof errors[name as string] === 'string'
        ? (errors[name as string] as string)
        : (errors[name as string] as { message?: string })?.message ?? ''
      : '';

  const contentProps = portalContainer ? { container: portalContainer } : {};

  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      {label && <label className='text-sm font-medium'>{label}</label>}

      <Select
        open={open}
        onOpenChange={setOpen}
        value={selectedValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          {triggerContent ? (
            <div className='truncate'>{triggerContent}</div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
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
            <SelectItem value={ADD_TOKEN}>
              <div className='flex items-center gap-2'>
                {addIcon ? <AppIcon icon={addIcon} /> : <span>+</span>}
                <span className='opacity-80'>
                  {addLabel || 'Προσθήκη νέου...'}
                </span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {errorMessage ? <AppErrorMessage message={errorMessage} /> : null}
    </div>
  );
}

export default AppSelect;
