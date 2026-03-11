"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart2,
  Settings,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/team", label: "Team", icon: Users },
  { href: "/insights", label: "Insights", icon: BarChart2 },
];

const bottomItems = [
  { href: "/settings/profile", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className='fixed left-4 top-4 z-40 rounded-md bg-card p-2 shadow-md lg:hidden'
        aria-label='Open menu'
      >
        <Menu className='h-5 w-5' />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className='fixed inset-0 z-40 bg-black/50 lg:hidden'
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 lg:relative lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo + Mobile close */}
        <div className='flex h-14 items-center justify-between border-b border-border px-4'>
          <div className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-primary' />
            <span className='font-semibold text-foreground'>Planify</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className='rounded-md p-1 hover:bg-muted lg:hidden'
            aria-label='Close menu'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Main nav */}
        <nav className='flex flex-1 flex-col gap-1 overflow-y-auto p-3'>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className='h-4 w-4' />
              <span className='truncate'>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className='border-t border-border p-3'>
          {bottomItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/settings")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className='h-4 w-4' />
              <span className='truncate'>{label}</span>
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
