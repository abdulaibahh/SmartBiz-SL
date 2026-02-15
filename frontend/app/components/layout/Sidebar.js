"use client";

import { LayoutDashboard, Settings, Brain } from "lucide-react";
import Link from "next/link";
import { CreditCard } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 h-screen p-5">
      <h1 className="text-xl font-bold mb-6">SmartBiz</h1>

      <nav className="space-y-3">
        <Link
          href="/"
          className="flex items-center gap-2 hover:text-indigo-400"
        >
          <LayoutDashboard size={18} /> Dashboard
        </Link>

        <Link
          href="/admin"
          className="flex items-center gap-2 hover:text-indigo-400"
        >
          <Brain size={18} /> Admin
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-2 hover:text-indigo-400"
        >
          <Settings size={18} /> Settings
        </Link>

        <Link
          href="/subscription"
          className="flex items-center gap-2 hover:text-indigo-400"
        >
          <CreditCard size={18} /> Subscription
        </Link>
      </nav>
    </aside>
  );
}
