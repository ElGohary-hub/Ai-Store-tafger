import { cookies } from "next/headers";
import { getAdminBySessionToken } from "@/lib/auth";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./AdminPanel";

export default function AdminPage() {
  const token = cookies().get("cms_token")?.value;
  const admin = getAdminBySessionToken(token);

  return admin ? <AdminPanel admin={{ email: admin.email, role: admin.role }} /> : <AdminLogin />;
}
