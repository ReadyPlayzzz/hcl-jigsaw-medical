import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareSphere | School Health & BMI Manager",
  description: "Modern student health management and BMI tracking platform powered by Groq AI.",
  keywords: ["student health", "BMI tracker", "AI health advisor", "school health manager"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
