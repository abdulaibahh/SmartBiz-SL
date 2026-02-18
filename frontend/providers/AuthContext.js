"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "@/services/api";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token) {
      setUser(storedUser ? JSON.parse(storedUser) : { token });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const { data } = await authAPI.login(credentials);
      localStorage.setItem("token", data.token);
      
      // Decode JWT to get user info
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      const userData = {
        id: payload.id,
        role: payload.role,
        business_id: payload.business_id,
      };
      
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || "Login failed" 
      };
    }
  };

  const register = async (data) => {
    try {
      await authAPI.register(data);
      return { success: true, message: "Registration successful! Please login." };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || "Registration failed" 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      isAuthenticated: !!user, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
