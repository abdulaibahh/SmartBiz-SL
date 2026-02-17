"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const path = usePathname();

  const link = (href, label) => (
    <Link
      href={href}
      className={`block px-4 py-2 rounded ${
        path === href ? "bg-blue-600 text-white" : "hover:bg-gray-200"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <aside className="w-64 bg-white border-r h-screen p-4">
      <h2 className="font-bold text-xl mb-6">SmartBiz</h2>
      <nav className="space-y-2">
        {link("/", "Dashboard")}
        {link("/subscription", "Subscription")}
        {link("/settings", "Settings")}
        {link("/admin", "Admin")}
      </nav>
    </aside>
  );
}
