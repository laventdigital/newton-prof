"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд", icon: "📊" },
  { href: "/admin/results", label: "Результаты", icon: "📋" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="font-bold text-gray-900">
                  ProfiTest <span className="text-purple-600 text-xs font-normal ml-1 bg-purple-50 px-2 py-0.5 rounded-full">Admin</span>
                </span>
              </Link>
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-purple-50 text-purple-700 font-medium"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← На сайт
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
