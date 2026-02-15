"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Card from "./components/ui/Card";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    sales: 0,
    customers: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/api/platform/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStats(res.data);
    } catch {
      toast.error("Failed to load stats");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Business Overview</h1>

      <div className="grid grid-cols-3 gap-5">
        <Card title="Revenue (NLE)" value={stats.revenue} />
        <Card title="Sales" value={stats.sales} />
        <Card title="Customers" value={stats.customers} />
      </div>
    </div>
  );
}
