import React, { createContext, useCallback, useContext, useState } from "react";

import { Toast } from "@/components/Toast";

type ToastContextValue = {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
  }, []);

  const showError = useCallback(
    (msg: string) => {
      show(msg || "Something went wrong. Please try again.");
    },
    [show]
  );

  const showSuccess = useCallback(
    (msg: string) => {
      show(msg);
    },
    [show]
  );

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      <Toast message={message} visible={visible} onDismiss={() => setVisible(false)} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showError: (m: string) => {},
      showSuccess: (m: string) => {}
    };
  }
  return ctx;
}
