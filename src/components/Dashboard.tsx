"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  IconPlus,
  IconSearch,
  IconUsers,
  IconCheckCircle,
  IconAlertTriangle,
  IconScale,
  IconChevronRight,
  IconDownload,
  IconUpload,
  IconRefresh,
  IconTrash,
  IconSparkles,
  IconX,
} from "./Icons";
import {
  StudentFormModal,
  ProfileModal,
  StudentRecord,
  calcBMI,
  getBMICategory,
  getBMIClass,
  getInitials,
} from "./StudentForm";
import { NavId } from "./Sidebar";

export interface DashboardProps {
  userName: string;
  userRole: string;
  activeNav: NavId;
  onNavigate?: (id: NavId) => void;
  students?: StudentRecord[];
  setStudents?: React.Dispatch<React.SetStateAction<StudentRecord[]>>;
  onOpenAssistant?: () => void;
}

// ── Default realistic sample data
export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: "STU-882104",
    name: "Aanya Patel",
    age: "14",
    gender: "Female",
    mobile: "9876543210",
    height: "158",
    weight: "48",
    bmi: 19.2,
    bmiCategory: "Normal",
    allergies: ["Peanuts"],
    infections: [],
    medications: ["Multivitamin"],
    aiSummary:
      "Aanya is in a healthy, optimal BMI range (19.2). Strict avoidance of peanuts is maintained. Consistent physical activity and adequate hydration sustain her balanced growth.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "STU-654921",
    name: "Rohan Verma",
    age: "16",
    gender: "Male",
    mobile: "9123456780",
    height: "172",
    weight: "79",
    bmi: 26.7,
    bmiCategory: "Overweight",
    allergies: ["Dust", "Pollen"],
    infections: ["Mild Bronchitis (Recovering)"],
    medications: ["Albuterol Inhaler (PRN)", "Cetirizine 10mg"],
    aiSummary:
      "Rohan's BMI is slightly elevated (26.7) with active allergic asthma symptoms. Keep rescue inhaler on hand during sports, and support gradual aerobic stamina building.",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "STU-431872",
    name: "Sneha Nair",
    age: "13",
    gender: "Female",
    mobile: "9456781230",
    height: "152",
    weight: "36",
    bmi: 15.6,
    bmiCategory: "Underweight",
    allergies: ["Lactose"],
    infections: [],
    medications: ["Iron Supplement", "Vitamin D3"],
    aiSummary:
      "Sneha is currently underweight (15.6) with lactose intolerance. Nutrient-dense dairy-free snacks (almond butter, seeds, lentils) and iron adherence are advised.",
    createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
  },
  {
    id: "STU-129045",
    name: "Kabir Mehta",
    age: "15",
    gender: "Male",
    mobile: "9988776655",
    height: "168",
    weight: "59",
    bmi: 20.9,
    bmiCategory: "Normal",
    allergies: [],
    infections: [],
    medications: [],
    aiSummary:
      "Kabir displays strong, healthy physical metrics with a BMI of 20.9 and no reported allergies or medications. Continuing regular team sports is recommended.",
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

export default function Dashboard({
  userName,
  userRole,
  activeNav,
  onNavigate,
  students: externalStudents,
  setStudents: externalSetStudents,
  onOpenAssistant,
}: DashboardProps) {
  // Load from localStorage or default if not controlled
  const [internalStudents, setInternalStudents] = useState<StudentRecord[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("caresphere_students");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_STUDENTS;
  });

  const students = externalStudents || internalStudents;
  const setStudents = externalSetStudents || setInternalStudents;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "normal" | "alert">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [viewingStudent, setViewingStudent] = useState<StudentRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // CSV Import state
  const [pendingImportStudents, setPendingImportStudents] = useState<StudentRecord[] | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // API status for settings
  const [apiStatus, setApiStatus] = useState<{
    loading: boolean;
    connected: boolean;
    model: string;
    keyPrefix: string | null;
  }>({
    loading: true,
    connected: false,
    model: "",
    keyPrefix: null,
  });

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("caresphere_students", JSON.stringify(students));
    }
  }, [students]);

  // Check Groq status on mount
  useEffect(() => {
    fetch("/api/groq-status")
      .then(res => res.json())
      .then(data => {
        setApiStatus({
          loading: false,
          connected: Boolean(data.connected),
          model: data.model || "Llama 3.3 70B",
          keyPrefix: data.activeKeyPrefix || null,
        });
      })
      .catch(() => {
        setApiStatus(prev => ({ ...prev, loading: false }));
      });
  }, []);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveStudent = (record: StudentRecord) => {
    setStudents(prev => {
      const idx = prev.findIndex(s => s.id === record.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
    triggerToast(editingStudent ? "Student record updated" : "New student record added");
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setViewingStudent(null);
    triggerToast("Student record removed", "error");
  };

  // CSV export handler
  const handleExportCSV = () => {
    if (students.length === 0) {
      triggerToast("No student records to export", "error");
      return;
    }

    const headers = [
      "ID",
      "Name",
      "Age",
      "Gender",
      "Mobile",
      "Height(cm)",
      "Weight(kg)",
      "BMI",
      "Category",
      "Allergies",
      "Infections",
      "Medications",
      "DateAdded",
    ];
    const rows = students.map(s => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      s.age,
      s.gender,
      s.mobile,
      s.height,
      s.weight,
      s.bmi,
      s.bmiCategory,
      `"${(s.allergies || []).join("; ").replace(/"/g, '""')}"`,
      `"${(s.infections || []).join("; ").replace(/"/g, '""')}"`,
      `"${(s.medications || []).join("; ").replace(/"/g, '""')}"`,
      new Date(s.createdAt).toLocaleDateString("en-IN"),
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `CareSphere_Health_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Exported CSV successfully");
  };

  // CSV import handler
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += c;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          triggerToast("Empty file provided", "error");
          return;
        }

        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          triggerToast("CSV must contain a header row and at least one record", "error");
          return;
        }

        const headerLine = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
        
        // Find column indices
        const nameIdx = headerLine.findIndex(h => h.includes("name"));
        const ageIdx = headerLine.findIndex(h => h.includes("age"));
        const genderIdx = headerLine.findIndex(h => h.includes("gender") || h.includes("sex"));
        const mobileIdx = headerLine.findIndex(h => h.includes("mobile") || h.includes("phone") || h.includes("contact"));
        const heightIdx = headerLine.findIndex(h => h.includes("height"));
        const weightIdx = headerLine.findIndex(h => h.includes("weight"));
        const idIdx = headerLine.findIndex(h => h === "id" || h.includes("studentid"));
        const allergyIdx = headerLine.findIndex(h => h.includes("allerg"));
        const infectionIdx = headerLine.findIndex(h => h.includes("infect"));
        const medIdx = headerLine.findIndex(h => h.includes("medicat") || h.includes("meds"));

        const parsed: StudentRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cells = parseCSVLine(lines[i]);
          if (cells.length < 2) continue;

          const name = nameIdx >= 0 ? cells[nameIdx] : cells[0] || `Student ${i}`;
          if (!name) continue;

          const age = ageIdx >= 0 && cells[ageIdx] ? cells[ageIdx] : "15";
          const rawGender = genderIdx >= 0 && cells[genderIdx] ? cells[genderIdx] : "Male";
          const gender = /female/i.test(rawGender) ? "Female" : /other/i.test(rawGender) ? "Other" : "Male";
          const mobile = mobileIdx >= 0 && cells[mobileIdx] ? cells[mobileIdx].replace(/\D/g, "") : "9876543210";
          const height = heightIdx >= 0 && cells[heightIdx] ? cells[heightIdx] : "160";
          const weight = weightIdx >= 0 && cells[weightIdx] ? cells[weightIdx] : "50";

          const hNum = parseFloat(height) || 160;
          const wNum = parseFloat(weight) || 50;
          const bmi = calcBMI(hNum, wNum);
          const bmiCategory = getBMICategory(bmi);

          const parseList = (str?: string) => {
            if (!str) return [];
            return str
              .split(/[;,]/)
              .map(s => s.trim())
              .filter(s => s.length > 0 && s.toLowerCase() !== "none");
          };

          const allergies = allergyIdx >= 0 ? parseList(cells[allergyIdx]) : [];
          const infections = infectionIdx >= 0 ? parseList(cells[infectionIdx]) : [];
          const medications = medIdx >= 0 ? parseList(cells[medIdx]) : [];

          const id = idIdx >= 0 && cells[idIdx] ? cells[idIdx] : `STU-${Date.now().toString().slice(-4)}${i}`;

          parsed.push({
            id,
            name,
            age,
            gender,
            mobile: mobile.padEnd(10, "0").slice(0, 10),
            height: hNum.toString(),
            weight: wNum.toString(),
            bmi,
            bmiCategory,
            allergies,
            infections,
            medications,
            aiSummary: `${name} has a recorded BMI of ${bmi} (${bmiCategory}). Clinical notes logged via CSV import.`,
            createdAt: new Date().toISOString(),
          });
        }

        if (parsed.length === 0) {
          triggerToast("No valid student rows found in CSV", "error");
          return;
        }

        setPendingImportStudents(parsed);
        setShowImportConfirm(true);
      } catch (err: unknown) {
        console.error("CSV parse error:", err);
        triggerToast("Failed to parse CSV file. Please check file format.", "error");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const confirmApplyImport = () => {
    if (pendingImportStudents && pendingImportStudents.length > 0) {
      setStudents(pendingImportStudents);
      triggerToast(`Imported ${pendingImportStudents.length} student records successfully`);
    }
    setPendingImportStudents(null);
    setShowImportConfirm(false);
  };

  const cancelImport = () => {
    setPendingImportStudents(null);
    setShowImportConfirm(false);
  };

  // Computed metrics
  const stats = useMemo(() => {
    const total = students.length;
    const normal = students.filter(s => s.bmiCategory === "Normal").length;
    const alerts = students.filter(s => s.bmiCategory !== "Normal").length;
    const underweight = students.filter(s => s.bmiCategory === "Underweight").length;
    const overweight = students.filter(s => s.bmiCategory === "Overweight").length;
    const obese = students.filter(s => s.bmiCategory === "Obese").length;

    const avgBmi = total
      ? (students.reduce((acc, s) => acc + s.bmi, 0) / total).toFixed(1)
      : "—";

    const avgHeight = total
      ? Math.round(students.reduce((acc, s) => acc + parseFloat(s.height || "0"), 0) / total)
      : 0;

    const avgWeight = total
      ? Math.round(students.reduce((acc, s) => acc + parseFloat(s.weight || "0"), 0) / total)
      : 0;

    return {
      total,
      normal,
      alerts,
      underweight,
      overweight,
      obese,
      avgBmi,
      avgHeight,
      avgWeight,
      normalPercent: total ? Math.round((normal / total) * 100) : 0,
    };
  }, [students]);

  // Filtered list
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s => {
      const matchText = `${s.name} ${s.mobile} ${s.id} ${s.gender} ${s.bmiCategory}`.toLowerCase();
      const matchesSearch = !q || matchText.includes(q);

      if (!matchesSearch) return false;
      if (filterTab === "normal") return s.bmiCategory === "Normal";
      if (filterTab === "alert") return s.bmiCategory !== "Normal";
      return true;
    });
  }, [students, searchQuery, filterTab]);

  return (
    <div className="page-container">
      {/* Toast Notice */}
      {toastMsg && (
        <div className={`toast-notice ${toastMsg.type}`}>
          {toastMsg.type === "success" ? (
            <IconCheckCircle size={18} style={{ color: "var(--ds-normal)" }} />
          ) : (
            <IconAlertTriangle size={18} style={{ color: "var(--ds-obese)" }} />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ────────────────── OVERVIEW VIEW ────────────────── */}
      {activeNav === "overview" && (
        <>
          {/* Hero Header */}
          <div className="hero-header">
            <div>
              <div className="hero-welcome">
                Overview · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </div>
              <h1 className="hero-title">
                Hello, {userName.split(" ")[0]} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ds-text-3)", textTransform: "capitalize" }}>({userRole})</span>
              </h1>
              <p className="hero-subtitle">
                Here is your school&apos;s current health snapshot and student vitals.
              </p>
            </div>
            <button
              id="dash-add-student"
              className="btn btn-primary"
              onClick={() => {
                setEditingStudent(null);
                setShowAddModal(true);
              }}
            >
              <IconPlus size={16} />
              <span>Add Student</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-box-top">
                <span className="stat-box-label">Total Enrolled</span>
                <div className="stat-box-icon" style={{ background: "var(--ds-primary-subtle)", color: "var(--ds-primary)" }}>
                  <IconUsers size={16} />
                </div>
              </div>
              <div className="stat-box-value">{stats.total}</div>
              <div className="stat-box-sub">Active student health records</div>
            </div>

            <div className="stat-box">
              <div className="stat-box-top">
                <span className="stat-box-label">Normal BMI</span>
                <div className="stat-box-icon" style={{ background: "var(--ds-normal-bg)", color: "var(--ds-normal)" }}>
                  <IconCheckCircle size={16} />
                </div>
              </div>
              <div className="stat-box-value" style={{ color: "var(--ds-normal)" }}>
                {stats.normal}
              </div>
              <div className="stat-box-sub">{stats.normalPercent}% within target healthy range</div>
            </div>

            <div className="stat-box">
              <div className="stat-box-top">
                <span className="stat-box-label">Health Attention</span>
                <div className="stat-box-icon" style={{ background: "var(--ds-underweight-bg)", color: "var(--ds-underweight)" }}>
                  <IconAlertTriangle size={16} />
                </div>
              </div>
              <div className="stat-box-value" style={{ color: stats.alerts > 0 ? "var(--ds-underweight)" : "var(--ds-text)" }}>
                {stats.alerts}
              </div>
              <div className="stat-box-sub">
                {stats.underweight} underweight · {stats.overweight + stats.obese} elevated
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-box-top">
                <span className="stat-box-label">Campus Avg BMI</span>
                <div className="stat-box-icon" style={{ background: "var(--ds-surface-2)", color: "var(--ds-text-2)" }}>
                  <IconScale size={16} />
                </div>
              </div>
              <div className="stat-box-value">{stats.avgBmi}</div>
              <div className="stat-box-sub">Healthy population benchmark</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="table-card">
            <div className="table-header-toolbar">
              <div className="filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${filterTab === "all" ? "active" : ""}`}
                  onClick={() => setFilterTab("all")}
                >
                  All Records <span className="pill-count">{students.length}</span>
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filterTab === "normal" ? "active" : ""}`}
                  onClick={() => setFilterTab("normal")}
                >
                  Normal BMI <span className="pill-count">{stats.normal}</span>
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filterTab === "alert" ? "active" : ""}`}
                  onClick={() => setFilterTab("alert")}
                >
                  Attention Needed <span className="pill-count">{stats.alerts}</span>
                </button>
              </div>

              <div className="toolbar-actions">
                <div className="search-box">
                  <IconSearch size={14} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, ID or mobile..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Import records from .csv file"
                >
                  <IconUpload size={14} />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportCSV}
                  title="Export records to CSV"
                >
                  <IconDownload size={14} />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div style={{ overflowX: "auto" }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Age / Gender</th>
                    <th>Emergency Contact</th>
                    <th>Biometrics</th>
                    <th>BMI Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <tr
                        key={student.id}
                        onClick={() => setViewingStudent(student)}
                      >
                        <td>
                          <div className="student-row-info">
                            <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 11 }}>
                              {getInitials(student.name)}
                            </div>
                            <div>
                              <div className="student-name">{student.name}</div>
                              <div className="student-id">{student.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{student.age} yrs</div>
                          <div style={{ fontSize: 11, color: "var(--ds-text-3)" }}>{student.gender}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                            {student.mobile}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{student.height} cm</div>
                          <div style={{ fontSize: 11, color: "var(--ds-text-3)" }}>{student.weight} kg</div>
                        </td>
                        <td>
                          <span className={`bmi-chip ${getBMIClass(student.bmiCategory)}`}>
                            {student.bmi} · {student.bmiCategory}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <IconChevronRight size={16} style={{ color: "var(--ds-text-3)" }} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "48px 20px" }}>
                        <div style={{ color: "var(--ds-text-3)", fontSize: 13 }}>
                          {searchQuery
                            ? `No students found matching "${searchQuery}"`
                            : "No student records available."}
                        </div>
                        {students.length === 0 && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ marginTop: 12 }}
                            onClick={() => setShowAddModal(true)}
                          >
                            <IconPlus size={14} /> Add First Student
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Showing {filteredStudents.length} of {students.length} students</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {onNavigate && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onNavigate("students")}
                  >
                    View Full Directory →
                  </button>
                )}
                {onOpenAssistant ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--ds-primary)", fontWeight: 600 }}
                    onClick={onOpenAssistant}
                  >
                    <IconSparkles size={13} />
                    <span>Consult Health AI Assistant →</span>
                  </button>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <IconSparkles size={13} style={{ color: "var(--ds-primary)" }} />
                    AI-Powered Health Analysis Ready
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ────────────────── STUDENTS DIRECTORY VIEW ────────────────── */}
      {activeNav === "students" && (
        <>
          <div className="hero-header">
            <div>
              <div className="hero-welcome">Directory</div>
              <h1 className="hero-title">Student Health Records</h1>
              <p className="hero-subtitle">
                Manage, inspect, and update student body mass index profiles.
              </p>
            </div>
            <button
              id="students-add"
              className="btn btn-primary"
              onClick={() => {
                setEditingStudent(null);
                setShowAddModal(true);
              }}
            >
              <IconPlus size={16} />
              <span>Add Student</span>
            </button>
          </div>

          <div className="table-card">
            <div className="table-header-toolbar">
              <div className="filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${filterTab === "all" ? "active" : ""}`}
                  onClick={() => setFilterTab("all")}
                >
                  All ({students.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filterTab === "normal" ? "active" : ""}`}
                  onClick={() => setFilterTab("normal")}
                >
                  Normal ({stats.normal})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${filterTab === "alert" ? "active" : ""}`}
                  onClick={() => setFilterTab("alert")}
                >
                  Needs Attention ({stats.alerts})
                </button>
              </div>

              <div className="toolbar-actions">
                <div className="search-box">
                  <IconSearch size={14} />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search directory..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  title="Import records from .csv file"
                >
                  <IconUpload size={14} />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportCSV}
                >
                  <IconDownload size={14} />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Age / Gender</th>
                    <th>Emergency Mobile</th>
                    <th>Height & Weight</th>
                    <th>BMI & Status</th>
                    <th>Date Added</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <tr
                        key={student.id}
                        onClick={() => setViewingStudent(student)}
                      >
                        <td>
                          <div className="student-row-info">
                            <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 11 }}>
                              {getInitials(student.name)}
                            </div>
                            <div>
                              <div className="student-name">{student.name}</div>
                              <div className="student-id">{student.id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{student.age} yrs</div>
                          <div style={{ fontSize: 11, color: "var(--ds-text-3)" }}>{student.gender}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                            {student.mobile}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{student.height} cm</div>
                          <div style={{ fontSize: 11, color: "var(--ds-text-3)" }}>{student.weight} kg</div>
                        </td>
                        <td>
                          <span className={`bmi-chip ${getBMIClass(student.bmiCategory)}`}>
                            {student.bmi} · {student.bmiCategory}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--ds-text-3)" }}>
                          {new Date(student.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <IconChevronRight size={16} style={{ color: "var(--ds-text-3)" }} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "48px 20px", color: "var(--ds-text-3)" }}>
                        No students found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Showing {filteredStudents.length} of {students.length} students</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleExportCSV}
              >
                <IconDownload size={13} />
                Export Clean CSV
              </button>
            </div>
          </div>
        </>
      )}

      {/* ────────────────── HEALTH ANALYTICS VIEW ────────────────── */}
      {activeNav === "analytics" && (
        <>
          <div className="hero-header">
            <div>
              <div className="hero-welcome">Analytics</div>
              <h1 className="hero-title">Health & BMI Distribution</h1>
              <p className="hero-subtitle">
                Population-level health trends, nutritional benchmarks, and risk distribution.
              </p>
            </div>
          </div>

          {/* BMI Distribution Breakdown Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
              BMI Status Distribution ({stats.total} Total Students)
            </h2>

            {/* Proportion Bar */}
            <div
              style={{
                height: 14,
                borderRadius: 7,
                display: "flex",
                overflow: "hidden",
                background: "var(--ds-surface-2)",
                marginBottom: 16,
              }}
            >
              {stats.underweight > 0 && (
                <div
                  style={{
                    width: `${(stats.underweight / (stats.total || 1)) * 100}%`,
                    background: "var(--ds-underweight)",
                  }}
                  title={`Underweight: ${stats.underweight}`}
                />
              )}
              {stats.normal > 0 && (
                <div
                  style={{
                    width: `${(stats.normal / (stats.total || 1)) * 100}%`,
                    background: "var(--ds-normal)",
                  }}
                  title={`Normal: ${stats.normal}`}
                />
              )}
              {stats.overweight > 0 && (
                <div
                  style={{
                    width: `${(stats.overweight / (stats.total || 1)) * 100}%`,
                    background: "var(--ds-overweight)",
                  }}
                  title={`Overweight: ${stats.overweight}`}
                />
              )}
              {stats.obese > 0 && (
                <div
                  style={{
                    width: `${(stats.obese / (stats.total || 1)) * 100}%`,
                    background: "var(--ds-obese)",
                  }}
                  title={`Obese: ${stats.obese}`}
                />
              )}
            </div>

            {/* Distribution Legend Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              <div style={{ background: "var(--ds-surface-2)", padding: "12px 14px", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ds-underweight)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Underweight</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.underweight}</div>
                <div style={{ fontSize: 11, color: "var(--ds-text-3)" }}>
                  {stats.total ? Math.round((stats.underweight / stats.total) * 100) : 0}% of campus
                </div>
              </div>

              <div style={{ background: "var(--ds-surface-2)", padding: "12px 14px", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ds-normal)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Normal BMI</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ds-normal)" }}>{stats.normal}</div>
                <div style={{ fontSize: 11, color: "var(--ds-text-3)" }}>
                  {stats.total ? Math.round((stats.normal / stats.total) * 100) : 0}% of campus
                </div>
              </div>

              <div style={{ background: "var(--ds-surface-2)", padding: "12px 14px", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ds-overweight)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Overweight</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.overweight}</div>
                <div style={{ fontSize: 11, color: "var(--ds-text-3)" }}>
                  {stats.total ? Math.round((stats.overweight / stats.total) * 100) : 0}% of campus
                </div>
              </div>

              <div style={{ background: "var(--ds-surface-2)", padding: "12px 14px", borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ds-obese)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Obese</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.obese}</div>
                <div style={{ fontSize: 11, color: "var(--ds-text-3)" }}>
                  {stats.total ? Math.round((stats.obese / stats.total) * 100) : 0}% of campus
                </div>
              </div>
            </div>
          </div>

          {/* Biometrics Summary Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            <div className="card">
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-3)", textTransform: "uppercase" }}>
                Campus Average Height
              </span>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>
                {stats.avgHeight} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ds-text-2)" }}>cm</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--ds-text-2)", marginTop: 4 }}>
                Across all enrolled students aged 3-25.
              </p>
            </div>

            <div className="card">
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-3)", textTransform: "uppercase" }}>
                Campus Average Weight
              </span>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>
                {stats.avgWeight} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ds-text-2)" }}>kg</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--ds-text-2)", marginTop: 4 }}>
                Measured during active school terms.
              </p>
            </div>

            <div className="card">
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-3)", textTransform: "uppercase" }}>
                Campus Average BMI
              </span>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: "var(--ds-primary)" }}>
                {stats.avgBmi}
              </div>
              <p style={{ fontSize: 12, color: "var(--ds-text-2)", marginTop: 4 }}>
                Optimal reference target is 18.5 – 24.9.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ────────────────── SETTINGS VIEW ────────────────── */}
      {activeNav === "settings" && (
        <>
          <div className="hero-header">
            <div>
              <div className="hero-welcome">Settings</div>
              <h1 className="hero-title">System & API Management</h1>
              <p className="hero-subtitle">
                Configure AI health advisor integration and manage local student data.
              </p>
            </div>
          </div>

          {/* AI Status Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              Groq AI Health Advisor Integration
            </h2>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                background: "var(--ds-surface-2)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--ds-border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: apiStatus.connected ? "var(--ds-normal)" : "var(--ds-underweight)",
                    boxShadow: `0 0 6px ${apiStatus.connected ? "var(--ds-normal)" : "var(--ds-underweight)"}`,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {apiStatus.loading
                      ? "Verifying connection..."
                      : apiStatus.connected
                      ? "Groq Cloud Connected (Active)"
                      : "Using Local Fallback Summaries"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ds-text-3)", marginTop: 2 }}>
                    Model: {apiStatus.model} {apiStatus.keyPrefix ? `· Key: ${apiStatus.keyPrefix}` : ""}
                  </div>
                </div>
              </div>

              <div
                className="status-indicator"
                style={{
                  background: apiStatus.connected ? "var(--ds-normal-bg)" : "var(--ds-underweight-bg)",
                  borderColor: apiStatus.connected ? "var(--ds-normal-border)" : "var(--ds-underweight-border)",
                  color: apiStatus.connected ? "var(--ds-normal)" : "var(--ds-underweight)",
                }}
              >
                {apiStatus.connected ? "Operational" : "Offline / Fallback"}
              </div>
            </div>

            <p style={{ fontSize: 12, color: "var(--ds-text-2)", marginTop: 12, lineHeight: 1.6 }}>
              Personalized health recommendations are generated dynamically using Groq&apos;s fast Llama 3.3 70B inference engine. API credentials are encrypted and stored in your environment configuration.
            </p>
          </div>

          {/* Data Controls Card */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              Data Management & Backup
            </h2>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportCSV}
              >
                <IconDownload size={15} />
                <span>Export All Records (CSV)</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStudents(INITIAL_STUDENTS);
                  triggerToast("Reset to sample student records");
                }}
              >
                <IconRefresh size={15} />
                <span>Reset to Sample Data</span>
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all student records?")) {
                    setStudents([]);
                    triggerToast("All records cleared", "error");
                  }
                }}
              >
                <IconTrash size={15} />
                <span>Clear All Records</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ────────────────── HIDDEN FILE INPUT FOR CSV IMPORT ────────────────── */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* ────────────────── CONFIRM IMPORT DIALOG ────────────────── */}
      {showImportConfirm && pendingImportStudents && (
        <div className="modal-backdrop" onClick={cancelImport}>
          <div className="modal-window" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ds-primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ds-primary)" }}>
                    <IconUpload size={16} />
                  </div>
                  <h2 className="modal-title" style={{ fontSize: 16 }}>Import Student Health Data</h2>
                </div>
                <p className="modal-subtitle">Confirm file replacement & data load</p>
              </div>
              <button className="modal-close-btn" onClick={cancelImport} aria-label="Close">
                <IconX size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "18px 24px" }}>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <IconAlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
                    <strong>Replace current dataset?</strong>
                    <div style={{ marginTop: 2 }}>
                      Do you want to discard your <strong>{students.length} current records</strong> and apply the <strong>{pendingImportStudents.length} new records</strong> from this CSV file?
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--ds-text-2)", background: "var(--ds-surface-2)", padding: "10px 12px", borderRadius: "var(--radius-sm)" }}>
                <div><strong>Summary of imported data:</strong></div>
                <ul style={{ margin: "6px 0 0", paddingLeft: 16, lineHeight: 1.5 }}>
                  <li>{pendingImportStudents.length} students found in file</li>
                  <li>First record: <strong>{pendingImportStudents[0]?.name}</strong> ({pendingImportStudents[0]?.age} yrs, {pendingImportStudents[0]?.gender})</li>
                  <li>Biometrics (BMI, height, weight) automatically computed</li>
                  <li>Allergies, infections & medications loaded</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelImport}
              >
                Cancel / Keep Current
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "var(--ds-primary)" }}
                onClick={confirmApplyImport}
              >
                <IconCheckCircle size={16} />
                <span>Discard & Apply New Records</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MODALS ────────────────── */}
      {showAddModal && (
        <StudentFormModal
          onClose={() => {
            setShowAddModal(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudent}
          existingRecord={editingStudent}
        />
      )}

      {viewingStudent && (
        <ProfileModal
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onEdit={() => {
            setEditingStudent(viewingStudent);
            setViewingStudent(null);
            setShowAddModal(true);
          }}
          onDelete={() => handleDeleteStudent(viewingStudent.id)}
        />
      )}
    </div>
  );
}
