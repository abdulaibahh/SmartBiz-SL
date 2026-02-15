"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import ProtectedRoute from "./components/ProtectedRoute";
import { io } from "socket.io-client";
import { notifySuccess } from "./components/useToast";

const API = process.env.NEXT_PUBLIC_API_URL;

function Dashboard() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  useEffect(() => {
    loadSales();

    // 🔴 Realtime revenue socket
    const socket = io(API);

    socket.on("revenueUpdate", data => {
      setStats(prev => ({
        ...prev,
        totalRevenue: data.totalRevenue
      }));
    });

    return () => socket.disconnect();
  }, []);

  async function loadSales() {
    try {
      const res = await axios.get(`${API}/api/sales/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSales(res.data);

      const total = res.data.reduce(
        (sum, s) => sum + Number(s.total),
        0
      );

      setStats({
        totalRevenue: total,
        totalSales: res.data.length
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function askAI() {
    try {
      const res = await axios.get(
        `${API}/api/ai/ask?question=${question}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiResponse(res.data.answer);
      notifySuccess("AI response received");
    } catch {
      console.error("AI error");
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">
        <h2 className="text-xl font-bold mb-8">SmartBiz</h2>
        <nav className="space-y-4 text-slate-400">
          <p className="hover:text-white cursor-pointer">Dashboard</p>
          <p className="hover:text-white cursor-pointer">Sales</p>
          <p className="hover:text-white cursor-pointer">Inventory</p>
          <p className="hover:text-white cursor-pointer">AI Insights</p>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 overflow-y-auto">
        <h1 className="text-3xl font-semibold mb-8">
          Business Overview
        </h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-slate-400">Total Revenue</p>
            <h2 className="text-2xl font-bold mt-2">
              ${stats.totalRevenue || 0}
            </h2>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <p className="text-slate-400">Total Sales</p>
            <h2 className="text-2xl font-bold mt-2">
              {stats.totalSales || 0}
            </h2>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mb-10">
          <h3 className="mb-4 text-lg">Sales Performance</h3>
          <Bar
            data={{
              labels: sales.map((_, i) => `Sale ${i + 1}`),
              datasets: [
                {
                  label: "Sales",
                  data: sales.map(s => s.total)
                }
              ]
            }}
          />
        </div>

        {/* AI Section */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h3 className="text-lg mb-4">Ask Your Business AI</h3>

          <div className="flex gap-4">
            <input
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="How can I increase profit margin?"
            />

            <button
              onClick={askAI}
              className="bg-indigo-600 px-6 rounded-lg font-medium"
            >
              Ask
            </button>
          </div>

          {aiResponse && (
            <div className="mt-6 bg-slate-800 p-4 rounded-lg border border-slate-700">
              {aiResponse}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardWrapper() {
  return (
    <ProtectedRoute adminOnly>
      <Dashboard />
    </ProtectedRoute>
  );
}
