"use client";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { dark, setDark } = useTheme();

  return (
    <button
      onClick={() => setDark(!dark)}
      className="px-3 py-2 bg-slate-800 rounded-lg"
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
