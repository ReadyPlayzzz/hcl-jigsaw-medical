import { NextResponse } from "next/server";

export async function GET() {
  const hasKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  return NextResponse.json({
    connected: hasKey,
    model: "gpt-oss-120b & qwen3.8-27b",
    provider: "Groq Cloud High-Speed Inference",
    activeKeyPrefix: hasKey ? `${process.env.GROQ_API_KEY!.slice(0, 7)}...` : null,
  });
}
