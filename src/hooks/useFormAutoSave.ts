import { useEffect, useRef, useCallback } from "react";

interface FormData {
  [key: string]: any;
}

export const useFormAutoSave = (
  formKey: string,
  formData: FormData,
  debounceMs: number = 1000
) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save form data to localStorage
  const saveFormData = useCallback(() => {
    try {
      localStorage.setItem(formKey, JSON.stringify(formData));
    } catch (error) {
      console.error("Failed to save form data to localStorage:", error);
    }
  }, [formKey, formData]);

  // Auto-save with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveFormData();
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, saveFormData, debounceMs]);

  // Load form data from localStorage
  const loadFormData = useCallback((): FormData | null => {
    try {
      const saved = localStorage.getItem(formKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to load form data from localStorage:", error);
      return null;
    }
  }, [formKey]);

  // Clear saved form data
  const clearFormData = useCallback(() => {
    try {
      localStorage.removeItem(formKey);
    } catch (error) {
      console.error("Failed to clear form data from localStorage:", error);
    }
  }, [formKey]);

  return { loadFormData, clearFormData, saveFormData };
};
