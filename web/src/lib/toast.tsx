import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

export type ToastMessage = {
  id: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
};

type ToastContextType = {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let globalAddToast: ((toast: Omit<ToastMessage, 'id'>) => void) | null = null;

export function showToast(toastInput: Omit<ToastMessage, 'id'>) {
  if (globalAddToast) {
    globalAddToast(toastInput);
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toastInput: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type: 'error', duration: 4000, ...toastInput };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast,
    };
  }
  return {
    showToast: ctx.addToast,
    removeToast: ctx.removeToast,
  };
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const type = toast.type || 'error';

  const badgeStyles = {
    error: 'bg-danger-subtle border-danger text-danger',
    success: 'bg-success-subtle border-success text-success',
    warning: 'bg-warning-subtle border-warning text-warning',
    info: 'bg-info-subtle border-info text-info',
  }[type];

  const icons = {
    error: '⚠️',
    success: '✓',
    warning: '⚡',
    info: 'ℹ️',
  }[type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${badgeStyles}`}
    >
      <span className="text-body-md font-bold select-none">{icons}</span>
      <div className="flex-1 space-y-0.5">
        {toast.title && <h4 className="text-body-sm font-semibold leading-snug">{toast.title}</h4>}
        <p className="text-body-sm opacity-90 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-body-sm font-bold opacity-60 hover:opacity-100 transition-opacity p-0.5"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
