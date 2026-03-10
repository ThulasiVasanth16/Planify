"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart2,
  Settings,
  Zap,
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

  return (
    <aside className='flex h-screen w-60 flex-col border-r border-border bg-card'>
      {/* Logo */}
      <div className='flex h-14 items-center gap-2 border-b border-border px-4'>
        <Zap className='h-5 w-5 text-primary' />
        <span className='font-semibold text-foreground'>Planify</span>
      </div>

      {/* Main nav */}
      <nav className='flex flex-1 flex-col gap-1 p-3'>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className='h-4 w-4' />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className='border-t border-border p-3'>
        {/* <div className='mb-2 flex items-center justify-between'>
          <UserButton />
        </div> */}
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className='h-4 w-4' />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
