"use client";

import React, { useState, useRef, useEffect } from "react";
import MarkdownMessage from "./MarkdownMessage";
import {
  IconX,
  IconSend,
  IconSparkles,
  IconBot,
  IconUser,
  IconRefresh,
} from "./Icons";
import { StudentRecord } from "./StudentForm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentRecord[];
}

const QUICK_PROMPTS = [
  "Which students have allergies or active medications?",
  "List any active infections and isolation guidance",
  "Which students currently have BMI health alerts?",
  "Recommend a care plan for students with chronic conditions",
];

export default function AIAssistantDrawer({
  isOpen,
  onClose,
  students,
}: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I am your **CareSphere Health & Patient Assistant**.\n\nI have access to your current school roster vitals and clinical records:\n- **Allergies & Ongoing Medications** (tracking precautions & contraindications)\n- **Active/Recent Infections** (school wellness & recovery advice)\n- **BMI Growth Benchmarks** & personalized nutrition guidance\n\nHow can I assist your health clinic today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to ensure layout is measured
      const timer = setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages]);

  const handleSend = async (userText?: string) => {
    const textToSend = userText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/health-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          students: students.map(s => ({
            name: s.name,
            age: s.age,
            gender: s.gender,
            bmi: s.bmi,
            bmiCategory: s.bmiCategory,
            allergies: s.allergies || [],
            infections: s.infections || [],
            medications: s.medications || [],
          })),
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.error || "Unable to retrieve advice at this moment.";

      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "**Connection issue** — I couldn't reach the AI engine right now.\n\n- Make sure the dev server is running (`npm run dev`)\n- Check your internet connection\n- Then try your question again 😊",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: "Chat history cleared. What health or patient inquiry can I help you with?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-drawer-container">
      {/* Header */}
      <div className="ai-drawer-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="ai-avatar-icon">
            <IconBot size={18} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="ai-drawer-title">CareSphere AI</span>
              <span className="ai-online-badge">Online</span>
            </div>
            <div className="ai-drawer-sub">
              {students.length} Student Profiles Loaded
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            className="ai-icon-btn"
            onClick={clearChat}
            title="Clear Chat History"
          >
            <IconRefresh size={14} />
          </button>
          <button
            type="button"
            className="ai-icon-btn"
            onClick={onClose}
            title="Close Assistant"
          >
            <IconX size={16} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="ai-drawer-body" ref={scrollContainerRef}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`ai-message-row ${msg.role === "user" ? "user-row" : "bot-row"}`}
          >
            {msg.role === "assistant" && (
              <div className="ai-avatar-sm">
                <IconSparkles size={12} />
              </div>
            )}
            <div className={`ai-message-bubble ${msg.role === "user" ? "user-bubble" : "bot-bubble"}`}>
              <div className="ai-message-text">
                {msg.role === "assistant" ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                )}
              </div>
              <div className="ai-message-time">{msg.timestamp}</div>
            </div>
            {msg.role === "user" && (
              <div className="ai-avatar-sm user-avatar-bubble">
                <IconUser size={12} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="ai-message-row bot-row">
            <div className="ai-avatar-sm">
              <IconSparkles size={12} />
            </div>
            <div className="ai-message-bubble bot-bubble">
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <div className="spinner" style={{ width: 14, height: 14 }} />
                <span style={{ fontSize: 12, color: "var(--ds-text-2)" }}>
                  Analyzing health records and medical guidance…
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts Chips */}
      {messages.length <= 2 && (
        <div className="ai-quick-prompts">
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--ds-text-3)", marginBottom: 6 }}>
            Suggested Queries
          </div>
          <div className="ai-prompts-scroll">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                type="button"
                className="ai-prompt-chip"
                onClick={() => handleSend(p)}
                disabled={loading}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="ai-drawer-footer">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="ai-input-form"
        >
          <input
            ref={inputRef}
            type="text"
            className="ai-chat-input"
            placeholder="Ask about students, health issues, BMI..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            type="submit"
            className="ai-send-btn"
            disabled={!input.trim() || loading}
            aria-label="Send query"
          >
            <IconSend size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
