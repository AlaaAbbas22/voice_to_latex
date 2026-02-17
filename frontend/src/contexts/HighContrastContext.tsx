import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "vatex-high-contrast";

function getStoredValue(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

function setStoredValue(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

interface HighContrastContextValue {
  isHighContrast: boolean;
  toggleHighContrast: () => void;
}

const HighContrastContext = createContext<HighContrastContextValue | null>(null);

export function HighContrastProvider({ children }: { children: ReactNode }) {
  const [isHighContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    setHighContrastState(getStoredValue());
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrastState((prev) => {
      const next = !prev;
      setStoredValue(next);
      return next;
    });
  }, []);

  const value = useMemo<HighContrastContextValue>(
    () => ({ isHighContrast, toggleHighContrast }),
    [isHighContrast, toggleHighContrast]
  );

  return (
    <HighContrastContext.Provider value={value}>
      {children}
    </HighContrastContext.Provider>
  );
}

export function useHighContrast(): HighContrastContextValue {
  const ctx = useContext(HighContrastContext);
  if (!ctx) {
    throw new Error("useHighContrast must be used within HighContrastProvider");
  }
  return ctx;
}

export function useHighContrastOptional(): HighContrastContextValue | null {
  return useContext(HighContrastContext);
}
