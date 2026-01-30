import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
} from 'react';

import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++idRef.current;
      const toast: Toast = { id, type, message };

      setToasts((prev) => [...prev, toast]);

      window.setTimeout(() => remove(id), 3000);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* simple global container */}
      <div className="toast toast-top toast-end z-50">
        {toasts.map((toast) => {
          const variantClass =
            toast.type === 'success'
              ? 'alert-success'
              : toast.type === 'error'
              ? 'alert-error'
              : 'alert-info';

          return (
            <div
              key={toast.id}
              className={`alert ${variantClass} shadow-lg flex items-center gap-2`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => remove(toast.id)}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return ctx;
}
