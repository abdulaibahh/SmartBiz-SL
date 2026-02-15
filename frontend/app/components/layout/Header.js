"use client";

import { LogOut } from "lucide-react";

export default function Header() {
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900">
      <h2 className="font-semibold">Dashboard</h2>

      <button onClick={logout} className="flex items-center gap-2 text-red-400">
        <LogOut size={18} /> Logout
      </button>
    </header>
  );
}
