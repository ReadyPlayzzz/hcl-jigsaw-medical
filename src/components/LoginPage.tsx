"use client";

import React, { useState } from "react";
import {
  IconUser,
  IconLock,
  IconEye,
  IconEyeOff,
  IconHospital,
  IconArrowRight,
  IconShield,
  IconSparkles,
} from "./Icons";

export type Role = "student" | "staff" | "admin";

interface LoginProps {
  onLogin: (role: Role, name: string) => void;
}

export default function LoginPage({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleFillAdmin = () => {
    setUsername("admin");
    setPassword("admin");
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const u = username.trim().toLowerCase();
    const p = password.trim();

    if (!u) {
      setError("Please enter your username.");
      return;
    }
    if (!p) {
      setError("Please enter your password.");
      return;
    }

    if (u === "admin" && p === "admin") {
      onLogin("admin", "Admin");
    } else {
      setError("Invalid credentials. Please use username: admin and password: admin");
    }
  };

  return (
    <div className="login-viewport">
      <div className="login-dual-card">
        {/* Left Showcase (Desktop & Tablets) */}
        <div className="login-showcase-panel">
          <div>
            <div className="brand-badge-pill">
              <IconHospital size={16} />
              <span>CareSphere Health OS</span>
            </div>
            <h1 className="showcase-heading">
              School Health & Biometric Management
            </h1>
            <p className="showcase-sub">
              Clinical-grade student health tracking, automated BMI status analytics, and AI-powered health advice.
            </p>
          </div>

          <div className="showcase-features">
            <div className="showcase-feature-item">
              <div className="feature-icon-box">
                <IconSparkles size={16} />
              </div>
              <div>
                <strong>AI Health Advisor</strong>
                <p>Real-time assistant for student health queries and clinical insights.</p>
              </div>
            </div>

            <div className="showcase-feature-item">
              <div className="feature-icon-box" style={{ background: "var(--ds-normal-bg)", color: "var(--ds-normal)" }}>
                <IconShield size={16} />
              </div>
              <div>
                <strong>Secure Single Admin Portal</strong>
                <p>Unified administrative access for student rosters and records.</p>
              </div>
            </div>
          </div>

          <div className="showcase-preview-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="preview-avatar">CS</div>
                <div>
                  <strong style={{ fontSize: 13, color: "var(--ds-text)" }}>Campus Clinic Active</strong>
                  <div style={{ fontSize: 11, color: "var(--ds-text-2)" }}>Vitals & Records Synced</div>
                </div>
              </div>
              <span className="bmi-chip bmi-normal" style={{ fontSize: 10 }}>Live System</span>
            </div>
          </div>
        </div>

        {/* Right Login Form */}
        <div className="login-form-panel">
          <div className="login-form-top">
            <div className="mobile-only-brand">
              <div className="brand-icon" style={{ width: 40, height: 40, margin: "0 auto 10px" }}>
                <IconHospital size={22} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "var(--ds-text)" }}>CareSphere</span>
            </div>

            <h2 className="login-portal-title">Administrator Login</h2>
            <p className="login-portal-sub">
              Enter your credentials to manage school health records.
            </p>
          </div>

          {/* Quick Demo Fill Pill */}
          <div className="admin-credential-hint">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <span style={{ fontSize: 11, color: "var(--ds-text-2)" }}>
                Credentials: <strong>admin</strong> / <strong>admin</strong>
              </span>
              <button
                type="button"
                className="demo-pill-btn"
                onClick={handleFillAdmin}
              >
                Auto-fill
              </button>
            </div>
          </div>

          <form className="login-form-body" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">
                Username <span>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span className="input-leading-icon">
                  <IconUser size={16} />
                </span>
                <input
                  id="login-username"
                  className="form-control"
                  style={{ paddingLeft: 38 }}
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password <span>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span className="input-leading-icon">
                  <IconLock size={16} />
                </span>
                <input
                  id="login-password"
                  className="form-control"
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                  type={showPassword ? "text" : "password"}
                  placeholder="admin"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-trailing-icon"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            {error && <div className="form-error" style={{ fontSize: 12 }}>{error}</div>}

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: 6, height: 46 }}
            >
              <span>Sign In as Admin</span>
              <IconArrowRight size={16} />
            </button>
          </form>

          <div className="login-security-notice">
            <IconShield size={13} style={{ color: "var(--ds-normal)" }} />
            <span>Secure Medical-Grade Session · CareSphere Clinic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
