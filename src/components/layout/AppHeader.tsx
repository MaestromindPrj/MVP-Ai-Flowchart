"use client";

import React from "react";
import Link from "next/link";
import { Search, Plus, Bell, ChevronRight } from "lucide-react";

interface AppHeaderProps {
  breadcrumbs?: { name: string; href?: string }[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showCreateButton?: boolean;
}

export function AppHeader({
  breadcrumbs,
  searchPlaceholder = "Search processes, owners, departments...",
  onSearch,
  showCreateButton = true,
}: AppHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-subtle">
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-900 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-bold">
                    {crumb.name}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <span className="text-slate-900 font-bold text-sm">
            JV Process Platform
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-72 hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-10 pr-3.5 h-10 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <button
          title="Notifications"
          className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-blue-600 rounded-full absolute top-2.5 right-2.5 ring-2 ring-white"></span>
        </button>

        {showCreateButton && (
          <Link
            href="/processes/new"
            className="inline-flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Process</span>
          </Link>
        )}
      </div>
    </header>
  );
}
