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

export type AppTextInputFieldProps<
  TFieldValues extends FieldValues = FieldValues
> = {
  label: React.ReactNode;
  name: FieldPath<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  error?: string | FieldError;
  required?: boolean | string;
  id?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'name' | 'type' | 'id' | 'placeholder'
>;

const AppTextInputField = <TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  type = 'text',
  placeholder = '',
  id,
  register,
  required = false,
  error,
  className,
  ...restProps
}: AppTextInputFieldProps<TFieldValues>) => {
  const inputId = id || name;
  const errorText = typeof error === 'string' ? error : error?.message;

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
        type={type}
        placeholder={placeholder}
        {...register(name, { required })}
        {...restProps}
      />

      {errorText && <AppErrorMessage message={errorText} />}
    </div>
  );
};

export default AppTextInputField;
