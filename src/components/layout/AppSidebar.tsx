"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitFork,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Sparkles,
  Layers,
  ChevronRight,
  LogOut,
} from "lucide-react";

interface AppSidebarProps {
  user?: {
    name: string;
    email: string;
    role?: string;
  } | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Processes", href: "/processes", icon: GitFork },
    { name: "Templates", href: "/templates", icon: Layers },
  ];

  const secondaryNavigation = [
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none h-screen sticky top-0">
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold tracking-tight shadow-sm">
          <GitFork className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <div className="font-bold text-slate-900 text-sm tracking-tight">
            JV Process
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Process Intelligence
          </div>
        </div>
      </div>

      <div className="px-3 py-4 flex-1 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <div>
            <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Workspace
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Preferences
            </div>
            <nav className="space-y-1">
              {secondaryNavigation.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              AI Assistant Active
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Intelligent workflow mapping and diagram synthesis engine connected.
            </p>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0) : "A"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {user?.name || "Alex Morgan"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.email || "alex@jvprocess.com"}
                </div>
              </div>
            </div>
            <Link
              href="/login"
              title="Sign Out"
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
