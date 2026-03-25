import { useState, useCallback } from "react";

/**
 * useFormState - reusable hook for managing form state
 * Eliminates form state boilerplate across components
 */
export function useFormState<T extends Record<string, any>>(
  initialState: T
) {
  const [form, setForm] = useState<T>(initialState);

  const updateField = useCallback(
    (field: keyof T, value: any) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateForm = useCallback((updates: Partial<T>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialState);
  }, [initialState]);

  return { form, updateField, updateForm, resetForm, setForm };
}

/**
 * useAsync - handle async operations with loading and error states
 * Useful for form submissions, API calls, etc
 */
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = false
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }, [asyncFunction]);

  return { ...state, execute };
}

/**
 * useValidation - form validation helper
 */
export interface ValidationRules<T> {
  [K in keyof T]?: (value: any) => string | null;
}

export function useValidation<T extends Record<string, any>>(
  validationRules: ValidationRules<T>
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback(
    (form: T): boolean => {
      const newErrors: Partial<Record<keyof T, string>> = {};
      let isValid = true;

      for (const field in validationRules) {
        const validator = validationRules[field];
        if (validator) {
          const error = validator(form[field]);
          if (error) {
            newErrors[field] = error;
            isValid = false;
          }
        }
      }

      setErrors(newErrors);
      return isValid;
    },
    [validationRules]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return { errors, validate, clearErrors };
}
