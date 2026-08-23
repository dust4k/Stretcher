"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80 safe-top">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-brand-700 dark:text-brand-500">
          Stretcher
        </Link>
        <nav className="flex gap-3 text-sm">
          <Link
            href="/"
            className={pathname === "/" ? "font-medium text-brand-600" : "text-neutral-600"}
          >
            Routine
          </Link>
          <Link
            href="/add"
            className={pathname === "/add" ? "font-medium text-brand-600" : "text-neutral-600"}
          >
            Add
          </Link>
          <Link
            href="/start"
            className={pathname === "/start" ? "font-medium text-brand-600" : "text-neutral-600"}
          >
            Start
          </Link>
        </nav>
      </div>
    </header>
  );
}
