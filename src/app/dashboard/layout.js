import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { verifyToken } from "@/lib/jwt";

export default async function DashboardLayout({ children }) {
  const token = (await cookies()).get("token")?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-gray-900 to-cyan-900 text-white">
      <div className="flex-1">
        <Navbar />

        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
