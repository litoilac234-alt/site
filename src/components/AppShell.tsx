import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { SelectedProjectProvider } from '../context/SelectedProjectContext';

export function AppShell() {
  return (
    <SelectedProjectProvider>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>
    </SelectedProjectProvider>
  );
}
