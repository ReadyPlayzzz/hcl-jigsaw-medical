import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, age, gender, height, weight, bmi, bmiCategory, allergies, infections, medications } = body;

    if (!name || !age || !bmi) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const allergiesText = Array.isArray(allergies) && allergies.length > 0 ? allergies.join(", ") : "None reported";
    const infectionsText = Array.isArray(infections) && infections.length > 0 ? infections.join(", ") : "None reported";
    const medicationsText = Array.isArray(medications) && medications.length > 0 ? medications.join(", ") : "None ongoing";

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        summary: `**Health Summary for ${name}**\n\nBased on the provided data, ${name} (Age: ${age}, ${gender}) has a BMI of ${bmi} which falls in the **${bmiCategory}** range.\n\n- **Clinical Notes:** Allergies: ${allergiesText} | Infections: ${infectionsText} | Meds: ${medicationsText}\n- Regular physical activity and balanced nutrition are recommended. Please consult a healthcare professional for personalized care.`,
      });
    }

    const prompt = `You are a friendly, evidence-based school health advisor. Generate a warm, encouraging, and clinically attentive health assessment for a student with the following comprehensive health record:

Name: ${name}
Age: ${age} years
Gender: ${gender}
Height: ${height} cm
Weight: ${weight} kg
BMI: ${bmi} (${bmiCategory})
Known Allergies: ${allergiesText}
Current / Recent Infections: ${infectionsText}
Ongoing Medications: ${medicationsText}

Write a concise, structured health summary (3-5 sentences or short bullet points) that:
1. Positively notes their current BMI status (${bmiCategory})
2. Specifically addresses their medical context (allergies: ${allergiesText}, infections: ${infectionsText}, medications: ${medicationsText}) with safe precautions if present
3. Gives 2 practical lifestyle or wellness recommendations tailored to their profile
4. Reminds them to follow up with the school nurse or pediatrician regarding their medications/allergies

Tone: Professional, caring, and encouraging for a school health clinic.`;

    let summary = "";
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "openai/gpt-oss-120b",
        max_tokens: 300,
        temperature: 0.7,
      });
      summary = completion.choices[0]?.message?.content || "";
    } catch {
      const fallback = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "qwen/qwen3.8-27b",
        max_tokens: 300,
        temperature: 0.7,
      });
      summary = fallback.choices[0]?.message?.content || "";
    }

    if (!summary) {
      summary = `${name} has a recorded BMI of ${bmi} (${bmiCategory}). Balanced nutrition and regular active play support healthy development.`;
    }

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    console.error("Groq API error in groq-summary:", (err as Error)?.message || err);
    return NextResponse.json({
      summary: `Health record logged. BMI status is in the recorded range. Regular physical activity, proper hydration, and balanced nutrition are recommended.`,
    });
  }
}
