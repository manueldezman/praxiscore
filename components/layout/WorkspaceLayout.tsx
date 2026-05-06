'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-[280px]">
        {children}
      </main>
    </div>
  );
}
