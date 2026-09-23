"use client";

import React, { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: { name: string; href?: string }[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showCreateButton?: boolean;
}

export function AppShell({
  children,
  breadcrumbs,
  searchPlaceholder,
  onSearch,
  showCreateButton,
}: AppShellProps) {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        setUser({
          name: "Alex Morgan",
          email: "alex@jvprocess.com",
          role: "Senior Process Consultant",
        });
      }
    }
    loadUser();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          breadcrumbs={breadcrumbs}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          showCreateButton={showCreateButton}
        />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
