// hooks/useFormSuccessError.ts
'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';

type ActionResult = { ok: true } | { ok: false; error?: string };

function normalizeErrorMessage(err: unknown): string | null {
  if (!err) return null;
  if (typeof err === 'string') return err;

  // if it's an Error-like
  if (typeof err === 'object' && err !== null) {
    const anyErr = err as any;
    if (typeof anyErr.message === 'string') return anyErr.message;
    if (typeof anyErr.error === 'string') return anyErr.error;
    if (typeof anyErr?.response?.data?.error === 'string')
      return anyErr.response.data.error;
    if (
      Array.isArray(anyErr.errors) &&
      typeof anyErr.errors[0]?.message === 'string'
    )
      return anyErr.errors[0].message;
  }

  try {
    return JSON.stringify(err);
  } catch {
    return null;
  }
}

function useFormSuccessError(props: {
  result?: ActionResult;
  error?: unknown;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
}) {
  const {
    result,
    error,
    successMessage = 'Operation successful',
    errorMessage = 'Something went wrong',
    onSuccess,
  } = props;

  // Επιτυχία/αποτυχία από το server result
  useEffect(() => {
    if (!result) return;
    if (result.ok) {
      toast.success(successMessage);
      onSuccess?.();
    } else {
      toast.error(result.error ?? errorMessage);
    }
    // Σκόπιμα δεν βάζουμε το onSuccess στο deps για να μη re-fire αν αλλάξει αναφορά
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, successMessage, errorMessage]);

  // Σφάλματα από το hook/fetch (π.χ. network/throw)
  useEffect(() => {
    if (!error) return;
    const msg = normalizeErrorMessage(error) ?? errorMessage;
    toast.error(msg);
  }, [error, errorMessage]);
}
export default useFormSuccessError;
