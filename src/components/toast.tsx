"use client";

import { useCallback, useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let addToastGlobal: ((message: string, type?: "success" | "error") => void) | null = null;

export function toast(message: string, type: "success" | "error" = "success") {
  addToastGlobal?.(message, type);
}

let nextId = 0;

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => { addToastGlobal = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-in-up flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {t.type === "success" ? (
            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
