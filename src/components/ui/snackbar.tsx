import {
  Alert,
  Snackbar,
  type AlertColor,
} from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type ToastPayload = {
  message: string;
  severity?: AlertColor;
};

type SnackbarContextValue = {
  showToast: (payload: ToastPayload) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<ToastPayload>({ message: "", severity: "info" });

  const showToast = useCallback((payload: ToastPayload) => {
    setToast(payload);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <SnackbarContext.Provider value={value}>
      <ToastBridge />
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={toast.severity || "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

function useSnackbarContext() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("SnackbarProvider is missing");
  return ctx;
}

export const toast = {
  success(message: string) {
    window.dispatchEvent(new CustomEvent("falh-toast", { detail: { message, severity: "success" } }));
  },
  error(message: string) {
    window.dispatchEvent(new CustomEvent("falh-toast", { detail: { message, severity: "error" } }));
  },
  info(message: string) {
    window.dispatchEvent(new CustomEvent("falh-toast", { detail: { message, severity: "info" } }));
  },
  warning(message: string) {
    window.dispatchEvent(new CustomEvent("falh-toast", { detail: { message, severity: "warning" } }));
  },
};

/** Bridge global toast API to React context (works outside components too). */
export function ToastBridge() {
  const { showToast } = useSnackbarContext();

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (detail?.message) showToast(detail);
    };
    window.addEventListener("falh-toast", handler);
    return () => window.removeEventListener("falh-toast", handler);
  }, [showToast]);

  return null;
}

export function Toaster() {
  return <ToastBridge />;
}

// Hook-based toast for in-component usage
export function useToast() {
  const { showToast } = useSnackbarContext();
  return {
    success: (message: string) => showToast({ message, severity: "success" }),
    error: (message: string) => showToast({ message, severity: "error" }),
    info: (message: string) => showToast({ message, severity: "info" }),
  };
}
