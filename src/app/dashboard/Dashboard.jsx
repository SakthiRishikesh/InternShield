"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { openEventStream } from "@/lib/realtime";

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let closeStream = null;
    let mounted = true;

    async function load() {
      try {
        const data = await api.dashboard.stats();
        if (!mounted) return;
        setStats(data.stats);
        setActivity(data.activity || []);
        closeStream = openEventStream(api.dashboard.eventsUrl(), {
          events: {
            dashboard: (payload) => {
              setStats(payload.stats);
              setActivity(payload.activity || []);
            },
          },
        });
      } catch {
        // fallback to empty
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
      closeStream?.();
    };
  }, []);

  const statCards = stats
    ? [
        { label: "Verifications", value: String(stats.verifications), color: "from-cyan-500 to-blue-600" },
        { label: "Scams Blocked", value: String(stats.scamsBlocked), color: "from-red-500 to-orange-600" },
        { label: "Reviews Posted", value: String(stats.reviews), color: "from-green-500 to-emerald-600" },
        { label: "Resume Scans", value: String(stats.resumeScans), color: "from-purple-500 to-pink-600" },
      ]
    : [
        { label: "Verifications", value: "—", color: "from-cyan-500 to-blue-600" },
        { label: "Scams Blocked", value: "—", color: "from-red-500 to-orange-600" },
        { label: "Reviews Posted", value: "—", color: "from-green-500 to-emerald-600" },
        { label: "Resume Scans", value: "—", color: "from-purple-500 to-pink-600" },
      ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto max-w-7xl p-8 pt-24"
    >
      <header className="mb-12">
        <h1 className="mb-2 font-serif text-4xl font-black tracking-tighter">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-gray-400">
          Track scam checks, resume health, and community feedback — all synced in real time.
        </p>
      </header>

      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="glass group relative overflow-hidden rounded-3xl p-8 transition-all hover:border-white/20"
          >
            <div
              className={`absolute right-0 top-0 h-24 w-24 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
            />
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
              {stat.label}
            </h3>
            <p className="text-4xl font-black">
              {loading ? (
                <span className="inline-block h-10 w-16 animate-pulse rounded-lg bg-white/10" />
              ) : (
                stat.value
              )}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="glass rounded-3xl p-8 lg:col-span-2">
          <h2 className="mb-6 font-serif text-xl font-bold">Recent Activity</h2>
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-white/5" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length > 0 ? (
            <div className="space-y-6">
              {activity.map((item, idx) => (
                <div key={idx} className="group flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-lg transition-transform group-hover:scale-110">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-200">{item.text}</p>
                    <p className="text-xs text-gray-500">{item.detail}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-600">
                    {timeAgo(item.time)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No activity yet. Run a verification scan or post a review to get started.
            </p>
          )}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="glass rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-8"
        >
          <h2 className="mb-6 font-serif text-xl font-bold text-cyan-400">
            Quick Actions
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-gray-400">
            Use Gemini AI to analyze internship offers and optimize your resume for ATS compatibility.
          </p>
          <div className="space-y-3">
            <a
              href="/verify"
              className="block w-full rounded-2xl bg-cyan-500 py-4 text-center font-bold text-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              Verify an Offer
            </a>
            <a
              href="/dashboard/resume"
              className="block w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-center font-bold text-white transition-all hover:bg-white/10"
            >
              Scan Resume
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
