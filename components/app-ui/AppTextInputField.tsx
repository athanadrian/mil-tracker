// AppTextInputField.tsx
'use client';

import * as React from 'react';
import type {
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { AppErrorMessage } from '@/components/app-ui';

// --- κοινοί props ---
type CommonProps = {
  label: React.ReactNode;
  required?: boolean | string;
  id?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'name' | 'type' | 'id' | 'placeholder'
>;

// --- έκδοση με RHF ---
type RhfProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  error?: string | FieldError;
};

// --- controlled έκδοση (χωρίς RHF) ---
type ControlledProps = {
  name: string;
  register?: never;
  error?: string; // εδώ περνάς απλό string αν θέλεις
};

export type AppTextInputFieldProps<
  TFieldValues extends FieldValues = FieldValues
> = CommonProps & (RhfProps<TFieldValues> | ControlledProps);

const AppTextInputField = <TFieldValues extends FieldValues = FieldValues>(
  props: AppTextInputFieldProps<TFieldValues>
) => {
  const {
    label,
    type = 'text',
    placeholder = '',
    required = false,
    className,
    id,
    error,
    ...rest
  } = props as any;

  const name: string = (props as any).name;
  const inputId = id || name;

  const errorText =
    typeof error === 'string'
      ? error
      : (error as FieldError | undefined)?.message;

  // Αν υπάρχει register => RHF mode
  const rhfMode = 'register' in props && typeof props.register === 'function';
  const rhfRegisterProps = rhfMode
    ? props.register((props as RhfProps<TFieldValues>).name, { required })
    : {};

  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      <label
        htmlFor={inputId}
        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
      >
        {label}
      </label>

      <Input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        // RHF props μόνο όταν είμαστε σε RHF mode
        {...(rhfMode ? rhfRegisterProps : {})}
        // controlled props (value/onChange κ.λπ.) όταν ΔΕΝ είμαστε σε RHF mode
        {...(!rhfMode ? rest : {})}
      />

      {errorText ? <AppErrorMessage message={errorText} /> : null}
    </div>
  );
};

export default AppTextInputField;
