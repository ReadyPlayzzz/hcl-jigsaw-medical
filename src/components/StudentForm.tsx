"use client";

import React, { useState, useMemo } from "react";
import MarkdownMessage from "./MarkdownMessage";
import {
  IconX,
  IconBrain,
  IconRefresh,
  IconCheckCircle,
  IconTrash,
  IconEdit,
  IconSparkles,
} from "./Icons";

export type Gender = "Male" | "Female" | "Other";

export interface StudentFormData {
  name: string;
  age: string;
  mobile: string;
  gender: Gender | "";
  height: string; // cm
  weight: string; // kg
  allergies: string[];       // e.g. ["Peanuts", "Dust"]
  infections: string[];      // e.g. ["Seasonal Flu", "Conjunctivitis"]
  medications: string[];     // e.g. ["Cetirizine 5mg", "Vitamin D"]
}

export interface StudentRecord extends StudentFormData {
  id: string;
  bmi: number;
  bmiCategory: string;
  aiSummary: string;
  createdAt: string;
}

// ── BMI calculations
export function calcBMI(height: number, weight: number): number {
  if (!height || !weight || height <= 0 || weight <= 0) return 0;
  const hMeters = height / 100;
  return parseFloat((weight / (hMeters * hMeters)).toFixed(1));
}

export function getBMICategory(bmi: number): string {
  if (bmi <= 0) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function getBMIClass(category: string): string {
  switch (category) {
    case "Normal":
      return "bmi-normal";
    case "Underweight":
      return "bmi-underweight";
    case "Overweight":
      return "bmi-overweight";
    case "Obese":
      return "bmi-obese";
    default:
      return "";
  }
}

export function getBMIPercent(bmi: number): number {
  // Map BMI scale 12 to 38 to 0% - 100%
  const min = 12;
  const max = 38;
  const clamped = Math.min(Math.max(bmi, min), max);
  return ((clamped - min) / (max - min)) * 100;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "S";
}

// ── BMI Meter Component
export function BMIMeter({ bmi, category }: { bmi: number; category: string }) {
  const percent = getBMIPercent(bmi);

  return (
    <div className="bmi-gauge-card">
      <div className="bmi-metrics-row">
        <div>
          <div className="bmi-numeric-big">{bmi}</div>
          <span style={{ fontSize: 12, color: "var(--ds-text-3)", fontWeight: 500 }}>kg/m²</span>
        </div>
        <div>
          <span className={`bmi-chip ${getBMIClass(category)}`} style={{ fontSize: 13, padding: "6px 14px" }}>
            {category}
          </span>
        </div>
      </div>

      <div className="bmi-scale-bar">
        <div
          className="bmi-marker-pin"
          style={{ left: `${percent}%` }}
          title={`BMI: ${bmi} (${category})`}
        />
      </div>

      <div className="bmi-legend-labels">
        <span>&lt; 18.5 Underweight</span>
        <span>18.5 – 24.9 Normal</span>
        <span>25 – 29.9 Overweight</span>
        <span>30+ Obese</span>
      </div>
    </div>
  );
}

// ── AI Summary Box
export function AISummaryBox({
  summary,
  loading,
  onRefresh,
}: {
  summary: string;
  loading: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className="ai-summary-card">
      <div className="ai-summary-header">
        <div className="ai-badge">
          <span className="ai-pulse-dot" />
          <IconSparkles size={13} />
          <span>AI Health Assessment</span>
        </div>
        {onRefresh && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onRefresh}
            disabled={loading}
            title="Regenerate summary"
          >
            <IconRefresh size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: "var(--ds-text-2)", fontSize: 13 }}>
          <div className="spinner" />
          <span>Generating personalized health insights with Groq AI…</span>
        </div>
      ) : summary ? (
        <div className="ai-summary-content">
          <MarkdownMessage content={summary} />
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--ds-text-3)" }}>
          Health summary will be generated upon calculating student vitals.
        </p>
      )}
    </div>
  );
}

// ── Add/Edit Student Form Modal
interface StudentFormModalProps {
  onClose: () => void;
  onSave: (record: StudentRecord) => void;
  existingRecord?: StudentRecord | null;
}

export function StudentFormModal({
  onClose,
  onSave,
  existingRecord,
}: StudentFormModalProps) {
  const [form, setForm] = useState<StudentFormData>({
    name: existingRecord?.name || "",
    age: existingRecord?.age || "",
    mobile: existingRecord?.mobile || "",
    gender: existingRecord?.gender || "Male",
    height: existingRecord?.height || "",
    weight: existingRecord?.weight || "",
    allergies: existingRecord?.allergies || [],
    infections: existingRecord?.infections || [],
    medications: existingRecord?.medications || [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});
  const [step, setStep] = useState<"input" | "review">("input");
  const [calculatedBMI, setCalculatedBMI] = useState<number>(existingRecord?.bmi || 0);
  const [calculatedCategory, setCalculatedCategory] = useState<string>(existingRecord?.bmiCategory || "");
  const [aiSummary, setAiSummary] = useState<string>(existingRecord?.aiSummary || "");
  const [aiLoading, setAiLoading] = useState(false);

  // Tag-input draft states
  const [allergyDraft, setAllergyDraft] = useState("");
  const [infectionDraft, setInfectionDraft] = useState("");
  const [medicationDraft, setMedicationDraft] = useState("");

  // Add / remove tag helpers
  const addTag = (field: "allergies" | "infections" | "medications", value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(trimmed) ? prev[field] : [...prev[field], trimmed],
    }));
  };

  const removeTag = (field: "allergies" | "infections" | "medications", tag: string) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter(t => t !== tag) }));
  };

  const handleTagKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "allergies" | "infections" | "medications",
    draft: string,
    setDraft: (v: string) => void
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(field, draft);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && form[field].length > 0) {
      removeTag(field, form[field][form[field].length - 1]);
    }
  };

  // Live BMI estimate
  const liveBMI = useMemo(() => {
    const h = parseFloat(form.height);
    const w = parseFloat(form.weight);
    if (h > 0 && w > 0) {
      return calcBMI(h, w);
    }
    return null;
  }, [form.height, form.weight]);

  const liveCategory = useMemo(() => {
    return liveBMI ? getBMICategory(liveBMI) : null;
  }, [liveBMI]);

  const setField = (key: keyof StudentFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {};

    if (!form.name.trim()) newErrors.name = "Full name is required";
    const ageNum = parseInt(form.age, 10);
    if (!form.age || isNaN(ageNum) || ageNum < 3 || ageNum > 25) {
      newErrors.age = "Valid age (3 - 25) required";
    }
    if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile.trim())) {
      newErrors.mobile = "10-digit mobile number required";
    }
    if (!form.gender) {
      newErrors.gender = "Gender is required";
    }
    const heightNum = parseFloat(form.height);
    if (!form.height || isNaN(heightNum) || heightNum < 50 || heightNum > 240) {
      newErrors.height = "Height between 50 - 240 cm required";
    }
    const weightNum = parseFloat(form.weight);
    if (!form.weight || isNaN(weightNum) || weightNum < 10 || weightNum > 250) {
      newErrors.weight = "Weight between 10 - 250 kg required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchAISummary = async (bmiVal: number, catVal: string) => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/groq-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          age: form.age,
          gender: form.gender,
          height: form.height,
          weight: form.weight,
          bmi: bmiVal,
          bmiCategory: catVal,
          allergies: form.allergies,
          infections: form.infections,
          medications: form.medications,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setAiSummary(data.summary || "Summary generated successfully.");
    } catch {
      setAiSummary(
        `Health evaluation for ${form.name}: BMI is ${bmiVal} (${catVal}). Maintain regular physical activities and balanced nutrition.`
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleProceedToReview = async () => {
    if (!validate()) return;

    const bmiVal = calcBMI(parseFloat(form.height), parseFloat(form.weight));
    const catVal = getBMICategory(bmiVal);
    setCalculatedBMI(bmiVal);
    setCalculatedCategory(catVal);
    setStep("review");

    // Fetch AI insights
    await fetchAISummary(bmiVal, catVal);
  };

  const handleFinalSave = () => {
    const record: StudentRecord = {
      ...form,
      gender: form.gender as Gender,
      id: existingRecord?.id || `STU-${Date.now().toString().slice(-6)}`,
      bmi: calculatedBMI,
      bmiCategory: calculatedCategory,
      aiSummary,
      createdAt: existingRecord?.createdAt || new Date().toISOString(),
    };
    onSave(record);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              {existingRecord ? "Edit Student Record" : "Add Student Health Record"}
            </h2>
            <p className="modal-subtitle">
              {step === "input"
                ? "Enter student biometric data to compute health metrics"
                : "Review BMI calculation and AI-generated health advice"}
            </p>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {step === "input" ? (
            <>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">
                  Student Full Name <span>*</span>
                </label>
                <input
                  id="sf-name"
                  className="form-control"
                  placeholder="e.g. Liam Anderson"
                  value={form.name}
                  onChange={e => setField("name", e.target.value)}
                />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>

              {/* Age & Mobile */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Age (Years) <span>*</span>
                  </label>
                  <input
                    id="sf-age"
                    type="number"
                    min="3"
                    max="25"
                    className="form-control"
                    placeholder="e.g. 15"
                    value={form.age}
                    onChange={e => setField("age", e.target.value)}
                  />
                  {errors.age && <div className="form-error">{errors.age}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Emergency Contact <span>*</span>
                  </label>
                  <input
                    id="sf-mobile"
                    type="tel"
                    maxLength={10}
                    className="form-control"
                    placeholder="10-digit number"
                    value={form.mobile}
                    onChange={e => setField("mobile", e.target.value.replace(/\D/g, ""))}
                  />
                  {errors.mobile && <div className="form-error">{errors.mobile}</div>}
                </div>
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">
                  Gender <span>*</span>
                </label>
                <div className="gender-button-group">
                  {(["Male", "Female", "Other"] as Gender[]).map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`gender-btn ${form.gender === g ? "active" : ""}`}
                      onClick={() => setField("gender", g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {errors.gender && <div className="form-error">{errors.gender}</div>}
              </div>

              {/* Height & Weight */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Height <span>*</span>
                  </label>
                  <div className="input-suffix-group">
                    <input
                      id="sf-height"
                      type="number"
                      step="0.5"
                      min="50"
                      max="240"
                      className="form-control"
                      placeholder="e.g. 165"
                      value={form.height}
                      onChange={e => setField("height", e.target.value)}
                    />
                    <span className="input-suffix">cm</span>
                  </div>
                  {errors.height && <div className="form-error">{errors.height}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Weight <span>*</span>
                  </label>
                  <div className="input-suffix-group">
                    <input
                      id="sf-weight"
                      type="number"
                      step="0.5"
                      min="10"
                      max="250"
                      className="form-control"
                      placeholder="e.g. 58"
                      value={form.weight}
                      onChange={e => setField("weight", e.target.value)}
                    />
                    <span className="input-suffix">kg</span>
                  </div>
                  {errors.weight && <div className="form-error">{errors.weight}</div>}
                </div>
              </div>

              {/* ── Medical Information Section ── */}
              <div style={{ marginTop: 6, marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ds-text)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  Medical & Clinical Background
                </div>

                {/* Allergies */}
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Allergies</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ds-text-3)" }}>Press Enter or comma to add</span>
                  </label>
                  <div className="tag-input-box">
                    {form.allergies && form.allergies.map(tag => (
                      <span key={tag} className="medical-tag allergy-tag">
                        {tag}
                        <button type="button" onClick={() => removeTag("allergies", tag)} className="tag-remove-btn" aria-label={`Remove ${tag}`}>×</button>
                      </span>
                    ))}
                    <input
                      className="tag-inline-input"
                      placeholder={form.allergies?.length ? "Add allergy..." : "e.g. Peanuts, Penicillin, Dust"}
                      value={allergyDraft}
                      onChange={e => setAllergyDraft(e.target.value)}
                      onKeyDown={e => handleTagKeyDown(e, "allergies", allergyDraft, setAllergyDraft)}
                      onBlur={() => { addTag("allergies", allergyDraft); setAllergyDraft(""); }}
                    />
                  </div>
                </div>

                {/* Infections */}
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Current / Recent Infections</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ds-text-3)" }}>Press Enter or comma to add</span>
                  </label>
                  <div className="tag-input-box">
                    {form.infections && form.infections.map(tag => (
                      <span key={tag} className="medical-tag infection-tag">
                        {tag}
                        <button type="button" onClick={() => removeTag("infections", tag)} className="tag-remove-btn" aria-label={`Remove ${tag}`}>×</button>
                      </span>
                    ))}
                    <input
                      className="tag-inline-input"
                      placeholder={form.infections?.length ? "Add infection..." : "e.g. Bronchitis, Strep Throat, Ear Infection"}
                      value={infectionDraft}
                      onChange={e => setInfectionDraft(e.target.value)}
                      onKeyDown={e => handleTagKeyDown(e, "infections", infectionDraft, setInfectionDraft)}
                      onBlur={() => { addTag("infections", infectionDraft); setInfectionDraft(""); }}
                    />
                  </div>
                </div>

                {/* Medications */}
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Ongoing Medications</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ds-text-3)" }}>Press Enter or comma to add</span>
                  </label>
                  <div className="tag-input-box">
                    {form.medications && form.medications.map(tag => (
                      <span key={tag} className="medical-tag medication-tag">
                        {tag}
                        <button type="button" onClick={() => removeTag("medications", tag)} className="tag-remove-btn" aria-label={`Remove ${tag}`}>×</button>
                      </span>
                    ))}
                    <input
                      className="tag-inline-input"
                      placeholder={form.medications?.length ? "Add medication..." : "e.g. Inhaler (Albuterol), Cetirizine 5mg, Insulin"}
                      value={medicationDraft}
                      onChange={e => setMedicationDraft(e.target.value)}
                      onKeyDown={e => handleTagKeyDown(e, "medications", medicationDraft, setMedicationDraft)}
                      onBlur={() => { addTag("medications", medicationDraft); setMedicationDraft(""); }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Bar if height and weight typed */}
              {liveBMI && liveBMI > 0 && liveCategory && (
                <div
                  style={{
                    background: "var(--ds-surface-2)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--ds-text-2)", fontWeight: 500 }}>
                    Live BMI Estimate:
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>{liveBMI}</strong>
                    <span className={`bmi-chip ${getBMIClass(liveCategory)}`}>
                      {liveCategory}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Review Step with Gauge and AI */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--ds-surface-2)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--ds-border)",
                }}
              >
                <div>
                  <strong style={{ fontSize: 14, color: "var(--ds-text)" }}>{form.name}</strong>
                  <div style={{ fontSize: 12, color: "var(--ds-text-2)", marginTop: 2 }}>
                    Age {form.age} · {form.gender} · {form.height}cm / {form.weight}kg
                  </div>
                </div>
              </div>

              {/* Medical summary chips in review */}
              {((form.allergies && form.allergies.length > 0) ||
                (form.infections && form.infections.length > 0) ||
                (form.medications && form.medications.length > 0)) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 14px", background: "#f8fafc", borderRadius: "var(--radius-sm)", border: "1px solid var(--ds-border)", fontSize: 12 }}>
                  {form.allergies && form.allergies.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "var(--ds-text-3)", minWidth: 80 }}>Allergies:</span>
                      {form.allergies.map(a => (
                        <span key={a} className="medical-tag allergy-tag" style={{ margin: 0 }}>{a}</span>
                      ))}
                    </div>
                  )}
                  {form.infections && form.infections.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "var(--ds-text-3)", minWidth: 80 }}>Infections:</span>
                      {form.infections.map(i => (
                        <span key={i} className="medical-tag infection-tag" style={{ margin: 0 }}>{i}</span>
                      ))}
                    </div>
                  )}
                  {form.medications && form.medications.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "var(--ds-text-3)", minWidth: 80 }}>Meds:</span>
                      {form.medications.map(m => (
                        <span key={m} className="medical-tag medication-tag" style={{ margin: 0 }}>{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <BMIMeter bmi={calculatedBMI} category={calculatedCategory} />

              <AISummaryBox
                summary={aiSummary}
                loading={aiLoading}
                onRefresh={() => fetchAISummary(calculatedBMI, calculatedCategory)}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step === "input" ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                id="sf-calculate"
                type="button"
                className="btn btn-primary"
                onClick={handleProceedToReview}
              >
                <IconBrain size={16} />
                <span>Calculate & Review</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep("input")}
              >
                Back to Edit
              </button>
              <button
                id="sf-save"
                type="button"
                className="btn btn-primary"
                onClick={handleFinalSave}
              >
                <IconCheckCircle size={16} />
                <span>Save Record</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Profile Modal (View student details)
interface ProfileModalProps {
  student: StudentRecord;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProfileModal({
  student,
  onClose,
  onEdit,
  onDelete,
}: ProfileModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">{student.name}</h2>
            <p className="modal-subtitle">
              Student ID: <span style={{ fontFamily: "var(--font-mono)" }}>{student.id}</span>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Quick info grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            <div style={{ background: "var(--ds-surface-2)", padding: "10px 12px", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: 11, color: "var(--ds-text-3)", fontWeight: 600 }}>AGE / GENDER</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                {student.age} yrs · {student.gender}
              </div>
            </div>
            <div style={{ background: "var(--ds-surface-2)", padding: "10px 12px", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: 11, color: "var(--ds-text-3)", fontWeight: 600 }}>HEIGHT / WEIGHT</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>
                {student.height}cm · {student.weight}kg
              </div>
            </div>
            <div style={{ background: "var(--ds-surface-2)", padding: "10px 12px", borderRadius: "var(--radius-sm)" }}>
              <div style={{ fontSize: 11, color: "var(--ds-text-3)", fontWeight: 600 }}>CONTACT</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, fontFamily: "var(--font-mono)" }}>
                {student.mobile}
              </div>
            </div>
          </div>

          <BMIMeter bmi={student.bmi} category={student.bmiCategory} />

          {/* Medical Clinical Record */}
          <div style={{ marginTop: 12, padding: "12px 14px", background: "var(--ds-surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--ds-border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Clinical History & Status
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontWeight: 600, color: "var(--ds-text-3)", minWidth: 90 }}>Allergies:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {student.allergies && student.allergies.length > 0 ? (
                    student.allergies.map(a => (
                      <span key={a} className="medical-tag allergy-tag" style={{ margin: 0 }}>{a}</span>
                    ))
                  ) : (
                    <span style={{ color: "var(--ds-text-3)", fontStyle: "italic" }}>None reported</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontWeight: 600, color: "var(--ds-text-3)", minWidth: 90 }}>Infections:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {student.infections && student.infections.length > 0 ? (
                    student.infections.map(i => (
                      <span key={i} className="medical-tag infection-tag" style={{ margin: 0 }}>{i}</span>
                    ))
                  ) : (
                    <span style={{ color: "var(--ds-text-3)", fontStyle: "italic" }}>None reported</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ fontWeight: 600, color: "var(--ds-text-3)", minWidth: 90 }}>Medications:</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {student.medications && student.medications.length > 0 ? (
                    student.medications.map(m => (
                      <span key={m} className="medical-tag medication-tag" style={{ margin: 0 }}>{m}</span>
                    ))
                  ) : (
                    <span style={{ color: "var(--ds-text-3)", fontStyle: "italic" }}>None ongoing</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {student.aiSummary && (
            <AISummaryBox summary={student.aiSummary} loading={false} />
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <div>
            {confirmDelete ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--ds-obese)", fontWeight: 600 }}>Confirm?</span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={onDelete}
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--ds-obese)" }}
                onClick={() => setConfirmDelete(true)}
              >
                <IconTrash size={15} />
                <span>Delete Record</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={onEdit}>
              <IconEdit size={15} />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
