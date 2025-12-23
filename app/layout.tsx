import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Nurse Home Care",
  description: "Book professional nurse home visits in minutes. Calm, reliable, and private care.",
};

// Helps mobile fit properly (especially iOS)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {/* App shell */}
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
