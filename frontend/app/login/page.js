"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login(e) {
    e.preventDefault();

    try {
      const res = await axios.post(`${API}/api/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      window.location.href = "/";
    } catch {
      toast.error("Invalid login");
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-700 to-purple-900">
      <form onSubmit={login} className="card p-8 w-80">
        <h2 className="text-xl font-bold mb-4">SmartBiz Login</h2>

        <input
          className="input mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="input mb-4"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn w-full">Login</button>
      </form>
    </div>
  );
}
