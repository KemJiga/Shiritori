import { useState, useEffect, useCallback } from 'react';

export interface ToastItem {
  id: number;
  message: string;
  type: 'info' | 'error' | 'success';
}

let nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

const typeStyles: Record<ToastItem['type'], { bg: string; accent: string }> = {
  info: { bg: 'bg-gray-900/95 border-gray-700/60', accent: 'bg-indigo-500' },
  error: { bg: 'bg-gray-900/95 border-red-700/40', accent: 'bg-red-500' },
  success: { bg: 'bg-gray-900/95 border-emerald-700/40', accent: 'bg-emerald-500' },
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-live="polite">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastNotification({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);
  const styles = typeStyles[toast.type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      role="status"
      className={`backdrop-blur-sm border rounded-xl shadow-xl max-w-xs cursor-pointer transition-all duration-300 overflow-hidden ${
        styles.bg
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
      onClick={() => onRemove(toast.id)}
    >
      <div className={`h-0.5 ${styles.accent}`} />
      <p className="text-sm text-gray-200 px-4 py-3">{toast.message}</p>
    </div>
  );
}
