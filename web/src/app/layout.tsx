import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stall Alerter — Hiring Pipeline Operational Console",
  description: "Production hiring pipeline stall detection, SLA monitoring, and recruiter decision support.",
  icons: {
    icon: "/stall-logo.svg",
    shortcut: "/stall-logo.svg",
    apple: "/stall-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
