import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface StudentSummary {
  name: string;
  age: string;
  gender: string;
  bmi: number;
  bmiCategory: string;
  allergies?: string[];
  infections?: string[];
  medications?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { messages, students } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages array" }, { status: 400 });
    }

    // Build roster context with medical clinical notes
    let rosterContext = "No student records currently loaded.";
    if (Array.isArray(students) && students.length > 0) {
      rosterContext = students
        .map((s: StudentSummary) => {
          const allergyStr = s.allergies && s.allergies.length > 0 ? s.allergies.join(", ") : "None";
          const infectStr = s.infections && s.infections.length > 0 ? s.infections.join(", ") : "None";
          const medStr = s.medications && s.medications.length > 0 ? s.medications.join(", ") : "None";
          return `- ${s.name} (Age: ${s.age}, ${s.gender}): BMI ${s.bmi} (${s.bmiCategory}) | Allergies: [${allergyStr}] | Infections: [${infectStr}] | Medications: [${medStr}]`;
        })
        .join("\n");
    }

    const systemPrompt = `You are "CareSphere AI Health Assistant", an intelligent, compassionate, and evidence-based school health advisor and clinical assistant.

CURRENT SCHOOL ROSTER CONTEXT:
The school currently has the following student health profiles with biometric and medical data:
${rosterContext}

YOUR RESPONSIBILITIES & GUIDELINES:
1. When asked about specific students, cohorts, or clinical concerns:
   - Identify who has specific allergies, active/recent infections, or ongoing medications.
   - Explain potential drug-allergy contraindications, cross-reactions, or physical activity precautions (e.g. asthma inhalers, penicillin allergy, peanut allergy, contagious infections like conjunctivitis/flu).
   - Correlate BMI alerts with medications or conditions where applicable.
2. For questions regarding allergies, infections, or medications:
   - Provide clear, safe, school-level clinical guidance (isolation periods for contagious infections, emergency protocols for anaphylaxis, dosage adherence reminders).
   - Emphasize consulting the attending physician or school nurse for prescription modifications.
3. Keep answers clear, structured with bullet points and bold highlights, and easy to read.
4. TABLE FORMATTING RULES (CRITICAL):
   - Every table row MUST start AND end with a pipe character: | col1 | col2 | col3 |
   - The separator row must also start and end with pipes: |---|---|---|
   - Never split a student entry across multiple lines — each student must be ONE single row
   - Example columns: Student | Age | BMI | Allergies | Infections | Medications
5. Always maintain a caring, professional, encouraging tone suitable for a school health clinic.`;

    // Filter and sanitize messages so history starts with a user turn
    const rawMessages = messages.filter(
      (m: { role?: string; content?: string }) =>
        m && typeof m.content === "string" && m.content.trim().length > 0
    );

    // Drop any initial assistant greetings from LLM payload
    const conversationHistory: { role: "user" | "assistant"; content: string }[] = [];
    let foundFirstUser = false;

    for (const msg of rawMessages) {
      if (!foundFirstUser && msg.role !== "user") {
        continue;
      }
      foundFirstUser = true;
      conversationHistory.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content.trim(),
      });
    }

    // If no user message was found in history, use the last message
    if (conversationHistory.length === 0) {
      const last = rawMessages[rawMessages.length - 1];
      conversationHistory.push({
        role: "user",
        content: last?.content?.trim() || "Provide an overview of school student health.",
      });
    }

    const groqPayload = [
      { role: "system" as const, content: systemPrompt },
      ...conversationHistory,
    ];

    if (!process.env.GROQ_API_KEY) {
      const lastMsg = conversationHistory[conversationHistory.length - 1]?.content || "";
      return NextResponse.json({
        reply: `**CareSphere Health Summary**\n\nRegarding your inquiry: "${lastMsg}"\n\n- **Roster Snapshot:** ${
          Array.isArray(students) ? students.length : 0
        } students enrolled.\n- **General Health Tip:** Promote balanced whole-food meals, 60 minutes of daily activity, and 2-3 liters of water.\n\n*(Connect your GROQ_API_KEY in .env.local for full interactive AI generation)*`,
      });
    }

    // Attempt primary high-intelligence model with fallback
    let reply = "";
    try {
      const completion = await groq.chat.completions.create({
        messages: groqPayload,
        model: "openai/gpt-oss-120b",
        temperature: 0.6,
        max_tokens: 700,
      });
      reply = completion.choices[0]?.message?.content || "";
    } catch (primaryErr) {
      console.warn("Primary model (openai/gpt-oss-120b) failed, trying secondary model (qwen/qwen3.8-27b):", primaryErr);
      const fallbackCompletion = await groq.chat.completions.create({
        messages: groqPayload,
        model: "qwen/qwen3.8-27b",
        temperature: 0.6,
        max_tokens: 600,
      });
      reply = fallbackCompletion.choices[0]?.message?.content || "";
    }

    if (!reply) {
      reply = "I evaluated the query, but was unable to produce a complete response. Please rephrase or specify the student name.";
    }

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Health Assistant API Error:", (error as Error)?.message || error);
    // Return a graceful, helpful response rather than an unhandled 500 error
    return NextResponse.json({
      reply: `**CareSphere Advisor Notice:**\n\nI was unable to complete the live Groq cloud query due to a connection timeout. \n\n**School Health Recommendation:**\n- For underweight or overweight students, monitor progress over 4-6 week intervals.\n- Ensure daily hydration and at least 45 minutes of moderate aerobic exercise.\n- Consult the school nurse or pediatrician for individualized dietary plans.`,
    });
  }
}
