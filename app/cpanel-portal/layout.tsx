import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI STORE Admin Dashboard",
  description: "Admin dashboard for managing AI STORE content and products.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#0a0c10] text-white selection:bg-[#E8A33D]/30 selection:text-[#E8A33D]">{children}</div>;
}
