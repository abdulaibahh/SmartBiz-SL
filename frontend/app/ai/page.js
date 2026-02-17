"use client";

import { useState, useRef, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { aiAPI } from "@/services/api";
import { Brain, Send, Loader2, Sparkles, Lightbulb, TrendingUp, Target } from "lucide-react";

function AIContent() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI business assistant. Ask me anything about your business - sales, inventory, finances, or get strategic advice. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await aiAPI.ask(userMessage);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: res.data?.answer || "I apologize, but I couldn't generate a response. Please try again."
      }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I encountered an error. Please make sure you have sales data and try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    { icon: TrendingUp, text: "How can I increase my sales?" },
    { icon: Target, text: "What products are selling best?" },
    { icon: Lightbulb, text: "Give me business growth tips" },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Brain className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">AI Assistant</h1>
          <p className="text-sm text-zinc-500">Get smart business insights</p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-100"
                }`}
              >
                <div className="flex items-start gap-2">
                  {msg.role === "assistant" && (
                    <Sparkles size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-zinc-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(q.text);
                    document.getElementById("ai-input")?.focus();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <q.icon size={14} />
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3">
            <input
              id="ai-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your business..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AI() {
  return (
    <ProtectedRoute>
      <AIContent />
    </ProtectedRoute>
  );
}
