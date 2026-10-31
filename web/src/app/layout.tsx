import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script id="suppress-extension-runtime-errors" strategy="beforeInteractive">
          {`
            // Prevent noisy third-party browser extensions (like chrome-extension://...) from crashing the React/Next.js UI dev overlay
            if (typeof window !== 'undefined') {
              window.addEventListener('unhandledrejection', function(event) {
                const reason = event.reason ? (event.reason.stack || event.reason.message || String(event.reason)) : '';
                if (reason.includes('chrome-extension://') || reason.includes('ff-content.js') || reason.includes('Window message "chrome: call method"')) {
                  event.preventDefault();
                  event.stopImmediatePropagation();
                }
              });
              window.addEventListener('error', function(event) {
                const msg = event.message || '';
                const filename = event.filename || '';
                if (filename.includes('chrome-extension://') || msg.includes('chrome: call method')) {
                  event.preventDefault();
                  event.stopImmediatePropagation();
                }
              });
            }
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
