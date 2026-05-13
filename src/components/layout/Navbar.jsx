"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/useAuthStore";

const PUBLIC_LINKS = [{ name: "Verify", href: "/verify" }];
const PRIVATE_LINKS = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Verify", href: "/verify" },
  { name: "Resume Check", href: "/dashboard/resume" },
  { name: "Reviews", href: "/dashboard/reviews" },
  { name: "Profile", href: "/dashboard/profile" },
];

function getLinkClasses(isActive) {
  return isActive
    ? "text-xs font-bold uppercase tracking-widest text-cyan-400"
    : "text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-cyan-400";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrating } = useAuth();
  const logout = useAuthStore((state) => state.logout);
  const loading = useAuthStore((state) => state.loading);
  const navLinks = user ? PRIVATE_LINKS : PUBLIC_LINKS;

  const handleLogout = async () => {
    const result = await logout();

    if (result.success) {
      router.replace("/auth/login");
      router.refresh();
    }
  };

  return (
    <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between px-6 py-4">
      <div className="absolute inset-0 border-b border-white/5 bg-black/40 backdrop-blur-xl" />

      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => router.push("/")}
        className="relative z-10 flex cursor-pointer items-center gap-2 group"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20 transition-all group-hover:shadow-cyan-500/40">
          <span className="text-sm font-black text-black">IS</span>
        </div>
        <h1 className="text-xl font-black tracking-tighter text-white">
          Intern<span className="text-cyan-400">Shield</span>
        </h1>
      </motion.div>

      <div className="relative z-10 hidden items-center gap-8 md:flex">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);

          return (
            <Link key={link.name} href={link.href} className={getLinkClasses(isActive)}>
              {link.name}
            </Link>
          );
        })}
      </div>

      <div className="relative z-10 flex items-center gap-3">
        {user ? (
          <>
            <span className="hidden text-xs font-medium uppercase tracking-wider text-gray-400 sm:block">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="rounded-lg bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing out..." : "Logout"}
            </button>
          </>
        ) : hydrating ? (
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Checking session...
          </span>
        ) : pathname.startsWith("/auth") ? (
          <button
            onClick={() => router.push("/verify")}
            className="rounded-lg bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-cyan-400"
          >
            Verify an Offer
          </button>
        ) : (
          <button
            onClick={() => router.push("/auth/login")}
            className="rounded-lg bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-cyan-400"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
