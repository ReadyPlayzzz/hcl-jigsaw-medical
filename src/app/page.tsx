"use client";

import { useState, useEffect } from "react";
import LoginPage, { Role } from "@/components/LoginPage";
import Sidebar, { NavId } from "@/components/Sidebar";
import Dashboard, { INITIAL_STUDENTS } from "@/components/Dashboard";
import { StudentRecord } from "@/components/StudentForm";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";
import { IconMenu, IconBot, IconSparkles } from "@/components/Icons";

interface Session {
  name: string;
  role: Role;
}

const NAV_TITLES: Record<NavId, string> = {
  overview: "Dashboard Overview",
  students: "Student Health Records",
  analytics: "Health & BMI Analytics",
  settings: "System & API Settings",
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("caresphere_session");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore
        }
      }
    }
    return null;
  });

  const [activeNav, setActiveNav] = useState<NavId>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  // Synchronized student state
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("caresphere_students");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_STUDENTS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("caresphere_students", JSON.stringify(students));
    }
  }, [students]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = mobileSidebarOpen ? "hidden" : "";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [mobileSidebarOpen]);

  const handleLogin = (role: Role, name: string) => {
    const s = { role, name };
    setSession(s);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("caresphere_session", JSON.stringify(s));
    }
    setActiveNav("overview");
  };

  const handleLogout = () => {
    setSession(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("caresphere_session");
    }
    setActiveNav("overview");
    setAiAssistantOpen(false);
  };

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={activeNav}
        onNav={id => {
          setActiveNav(id);
          setMobileSidebarOpen(false);
        }}
        userName={session.name}
        userRole={session.role}
        onLogout={handleLogout}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onOpenAssistant={() => setAiAssistantOpen(true)}
      />

      <div className="main-wrapper">
        {/* Modern Clean Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              <IconMenu size={20} />
            </button>
            <div className="topbar-page-title">{NAV_TITLES[activeNav]}</div>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="topbar-ai-btn"
              onClick={() => setAiAssistantOpen(prev => !prev)}
              title="Open AI Health Assistant"
            >
              <IconSparkles size={14} />
              <span>AI Advisor</span>
            </button>

            <div className="status-indicator">
              <span className="status-dot" />
              <span>AI Live</span>
            </div>
          </div>
        </header>

        {/* Dashboard Views */}
        <Dashboard
          userName={session.name}
          userRole={session.role}
          activeNav={activeNav}
          onNavigate={setActiveNav}
          students={students}
          setStudents={setStudents}
          onOpenAssistant={() => setAiAssistantOpen(true)}
        />
      </div>

      {/* ── Floating AI Assistant Action Button (Bottom of Pages) ── */}
      <button
        type="button"
        id="floating-ai-trigger"
        className={`floating-ai-fab ${aiAssistantOpen ? "active" : ""}`}
        onClick={() => setAiAssistantOpen(prev => !prev)}
        title="Ask CareSphere Health AI Assistant"
        aria-label="Toggle Health AI Assistant"
      >
        <span className="fab-icon-glow" />
        <IconBot size={22} className="fab-bot-icon" />
        <span className="fab-text">Ask Health AI</span>
        <span className="fab-badge">Llama 3.3</span>
      </button>

      {/* ── AI Assistant Chat Drawer ── */}
      <AIAssistantDrawer
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        students={students}
      />
    </div>
  );
}
