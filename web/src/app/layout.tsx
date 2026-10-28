import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stall Alerter — Hiring Pipeline Operational Console (Next.js)",
  description: "Production hiring pipeline stall detection, SLA monitoring, and recruiter decision support.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
