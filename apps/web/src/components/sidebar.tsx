"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  LayoutDashboard,
  FileText,
  FlaskConical,
  Boxes,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Team = { id: string; name: string; slug: string };
type User = { id: string; email: string; name?: string | null; image?: string | null };

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prompts", label: "Prompts", icon: FileText },
  { href: "/evals", label: "Evals", icon: FlaskConical },
  { href: "/environments", label: "Environments", icon: Boxes },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  user,
  teams,
  initialCollapsed,
}: {
  user: User;
  teams: Team[];
  initialCollapsed: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [, start] = useTransition();
  const activeTeam = teams[0];

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `sb_collapsed=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    start(() => { });
  }

  return (
    <aside
      className={cn(
        "border-r border-neutral-200 bg-white flex flex-col transition-[width] duration-150",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <div
        className={cn(
          "border-b border-neutral-200 flex items-center",
          collapsed ? "justify-center px-1 py-4" : "justify-between px-4 py-4"
        )}
      >
        {collapsed ? (
          <button
            onClick={toggle}
            aria-label="Expand sidebar"
            className="shrink-0"
          >
            <Image
              src="/logo-bg.png"
              alt="Lexem"
              width={1229}
              height={629}
              style={{ height: 24, width: "auto" }}
              className="shrink-0 block"
              priority
            />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <Image
                src="/logo-bg.png"
                alt="Lexem"
                width={1229}
                height={629}
                style={{ height: 28, width: "auto" }}
                className="shrink-0 block"
                draggable={false}
                priority
              />
              <div className="min-w-0">
                <div className="font-serif font-semibold text-2xl leading-none tracking-wide">Lexem</div>

              </div>
            </div>
            <button
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 text-sm",
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-100",
                collapsed && "justify-center"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-2">
        {!collapsed && (
          <div className="px-2.5 py-1.5 flex items-center gap-2 text-sm text-neutral-500">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="w-5 h-5 shrink-0 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="w-5 h-5 flex items-center justify-center bg-neutral-200 text-neutral-600 shrink-0">
                <UserIcon size={12} />
              </span>
            )}
            <span className="truncate">{user.name ?? user.email}</span>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-2.5 py-2 text-sm text-neutral-700 hover:bg-neutral-100",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
