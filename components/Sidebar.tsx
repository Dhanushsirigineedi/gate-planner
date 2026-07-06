"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/syllabus", label: "Syllabus bank" },
  { href: "/weekly", label: "Weekly plan" },
  { href: "/daily", label: "Daily plan" },
  { href: "/admin", label: "Admin" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-neutral-200 min-h-screen py-6 px-3 bg-white">
      <div className="text-sm font-semibold px-3 mb-6 text-neutral-800">
        GATE CSE planner
      </div>
      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm px-3 py-2 rounded-lg transition ${
                active
                  ? "bg-neutral-900 text-white font-medium"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
