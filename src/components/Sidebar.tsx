"use client";

import React from "react";
import {
  IconHome,
  IconUsers,
  IconChart,
  IconSettings,
  IconLogOut,
  IconHospital,
  IconSparkles,
  IconX,
} from "./Icons";

export type NavId = "overview" | "students" | "analytics" | "settings";

interface SidebarProps {
  active: NavId;
  onNav: (id: NavId) => void;
  userName: string;
  userRole: string;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenAssistant?: () => void;
}

const navItems: { id: NavId; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: "overview", label: "Dashboard", Icon: IconHome },
  { id: "students", label: "Students", Icon: IconUsers },
  { id: "analytics", label: "Health Analytics", Icon: IconChart },
  { id: "settings", label: "Settings", Icon: IconSettings },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";
}

export default function Sidebar({
  active,
  onNav,
  userName,
  userRole,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
  onOpenAssistant,
}: SidebarProps) {
  return (
    <>
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.4)",
            zIndex: 35,
          }}
        />
      )}
      <aside className={`sidebar ${isOpenMobile ? "mobile-open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-header">
          <div className="brand-icon">
            <IconHospital size={20} />
          </div>
          <div className="brand-info">
            <span className="brand-title">CareSphere</span>
            <span className="brand-subtitle">Health Management</span>
          </div>
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-nav">
          <div className="nav-section-title">Menu</div>
          {navItems.map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => {
                onNav(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
            >
              <item.Icon size={18} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          ))}

          {/* AI Assistant Nav Item */}
          <div className="nav-section-title" style={{ marginTop: 12 }}>Intelligent Health</div>
          <button
            type="button"
            className="nav-item nav-item-ai"
            onClick={() => {
              if (onOpenAssistant) onOpenAssistant();
              if (onCloseMobile) onCloseMobile();
            }}
            title="Open CareSphere Health AI Assistant"
          >
            <IconSparkles size={18} className="nav-icon" style={{ color: "var(--ds-primary)" }} />
            <span>AI Health Advisor</span>
            <span className="sidebar-ai-tag">AI</span>
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{getInitials(userName)}</div>
            <div className="user-details">
              <div className="user-name" title={userName}>
                {userName}
              </div>
              <span className="user-role-badge">{userRole}</span>
            </div>
            <button
              className="logout-btn"
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <IconLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
