import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchCatalog, type CatalogData } from "./api";
import type { Engine, PowertrainKey } from "./catalog";

interface CatalogContextValue {
  data: CatalogData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchCatalog(controller.signal)
      .then((catalog) => {
        setData(catalog);
        setLoading(false);
      })
      .catch((err: unknown) => {
        // A superseded/aborted request must not touch state: a newer request is
        // in flight (or we're unmounting). Clearing `loading` here would expose
        // a `loading=false, data=null` window that crashes data-dependent pages
        // (e.g. on an F5 reload of /configure). Let the winning request win.
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load catalog");
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => load(), [load]);

  return (
    <CatalogContext.Provider value={{ data, loading, error, reload: load }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) {
    throw new Error("useCatalog must be used within a CatalogProvider");
  }
  return ctx;
}

// Assumes the catalog has loaded — only call from routes rendered after the
// provider's loading gate in App.
export function useCatalogData(): CatalogData {
  const { data } = useCatalog();
  if (!data) {
    throw new Error("Catalog data is not loaded yet");
  }
  return data;
}

export function enginesFor(data: CatalogData, powertrain: PowertrainKey): Engine[] {
  return data.engines[powertrain] ?? [];
}
