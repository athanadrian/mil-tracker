'use client';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';

import type {
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from 'react-hook-form';
import { AppErrorMessage } from '@/components/app-ui';

export type AppTextareaProps<TFieldValues extends FieldValues = FieldValues> = {
  label: React.ReactNode;
  name: FieldPath<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  error?: string | FieldError;
  required?: boolean | string; // boolean ή μήνυμα validation
  id?: string;
  placeholder?: string;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'name' | 'id' | 'placeholder'
>;

const AppTextarea = <TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  placeholder = '',
  id,
  register,
  required = false,
  error,
  className,
  ...restProps
}: AppTextareaProps<TFieldValues>) => {
  const inputId = id || (name as string);
  const errorText = typeof error === 'string' ? error : error?.message;

  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')}>
      <label
        htmlFor={inputId}
        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
      >
        {label}
      </label>

      <Textarea
        id={inputId}
        placeholder={placeholder}
        {...register(name, { required })}
        {...restProps}
      />

      {errorText && <AppErrorMessage message={errorText} />}
    </div>
  );
};

export default AppTextarea;
