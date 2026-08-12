import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI STORE Admin Dashboard",
  description: "Admin dashboard for managing AI STORE content and products.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
}
