import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'sitetrack_project';

interface SelectedProjectValue {
  projectId: string;
  setProjectId: (id: string) => void;
}

const SelectedProjectContext = createContext<SelectedProjectValue | null>(null);

export function SelectedProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '1';
  });

  const setProjectId = useCallback((id: string) => {
    if (!id) return;
    setProjectIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const value = useMemo(() => ({ projectId, setProjectId }), [projectId, setProjectId]);

  return (
    <SelectedProjectContext.Provider value={value}>{children}</SelectedProjectContext.Provider>
  );
}

export function useSelectedProject() {
  const ctx = useContext(SelectedProjectContext);
  if (!ctx) {
    throw new Error('useSelectedProject must be used within SelectedProjectProvider');
  }
  return ctx;
}
