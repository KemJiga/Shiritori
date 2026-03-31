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

const typeStyles: Record<ToastItem['type'], string> = {
  info: 'bg-gray-800 border-gray-600',
  error: 'bg-red-900/80 border-red-700',
  success: 'bg-green-900/80 border-green-700',
};

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
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

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`border rounded-lg px-4 py-3 shadow-lg max-w-xs transition-all duration-300 cursor-pointer ${
        typeStyles[toast.type]
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      onClick={() => onRemove(toast.id)}
    >
      <p className="text-sm text-gray-200">{toast.message}</p>
    </div>
  );
}
