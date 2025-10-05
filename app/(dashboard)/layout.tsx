"use client";
import React, { useEffect, useState } from 'react';
import { SidebarWrap } from '@/components/shared/sidebar-wrap';
import { useSidebar } from '../hooks/use-sidebar';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Avoid rendering on the server until the client is ready
  }

  return (
    <div className="flex min-h-screen">
      <SidebarWrap />
      <main
        className={cn(
          "flex-1 p-4 md:p-8 transition-all duration-300",
          isCollapsed ? "ml-14" : "ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
}