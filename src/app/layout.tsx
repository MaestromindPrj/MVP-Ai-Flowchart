import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JV Process | AI-Assisted Business Process Intelligence",
  description:
    "Design, map, iterate, and document enterprise business workflows with AI assistance and visual flowchart governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
