"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "📅", label: "Plan" },
  { href: "/recipes", icon: "📖", label: "Recipes" },
  { href: "/grocery", icon: "🛒", label: "Grocery" },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 flex justify-around py-2 text-xs z-50">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex flex-col items-center gap-1 ${
            isActive(tab.href) ? "text-green-600" : "text-gray-500"
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
