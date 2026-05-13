"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProfilePage() {
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.profile.get();
        setProfile(data.profile);
      } catch {
        // Use auth user as fallback
        if (user) {
          setProfile({
            name: user.name || "Student",
            email: user.email || "",
            phone: "",
            role: "Student",
            university: "",
            gradYear: "",
            preferences: { location: "Remote", domain: "", salary: "" },
          });
        }
      }
    }

    load();
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProfile((current) => ({
        ...current,
        [parent]: { ...current[parent], [child]: value },
      }));
      return;
    }

    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    setSaving(true);
    setSaveMsg("");

    try {
      const data = await api.profile.update({
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        university: profile.university,
        gradYear: profile.gradYear,
        preferences: profile.preferences,
      });

      setProfile(data.profile);
      setUser({
        id: data.profile.id,
        name: data.profile.name,
        email: data.profile.email,
      });
      setIsEditing(false);
      setSaveMsg("Profile saved successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setLoadError(err.message || "Failed to save.");
      setTimeout(() => setLoadError(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-500"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-cyan-500/30">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        {saveMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300"
          >
            {saveMsg}
          </motion.div>
        )}

        {loadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {loadError}
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 lg:col-span-4"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-3xl">
              <div className="mb-10 flex flex-col items-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-cyan-600 to-blue-700 text-4xl font-black shadow-2xl shadow-cyan-500/20">
                  {profile.name.charAt(0)}
                </div>
                {isEditing ? (
                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-cyan-500/50 bg-white/5 px-4 py-2 text-center text-2xl font-bold focus:outline-none"
                  />
                ) : (
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                )}
                <p className="mt-1 text-sm uppercase tracking-tighter text-gray-500">
                  {profile.email}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Institution
                  </label>
                  {isEditing ? (
                    <input
                      name="university"
                      value={profile.university}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                      placeholder="Your university"
                    />
                  ) : (
                    <p className="mt-1 text-sm font-medium text-gray-300">
                      {profile.university || "Not set"}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Graduation
                    </label>
                    {isEditing ? (
                      <input
                        name="gradYear"
                        value={profile.gradYear}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                        placeholder="2026"
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium text-gray-300">
                        {profile.gradYear ? `Class of ${profile.gradYear}` : "Not set"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                        placeholder="+91..."
                      />
                    ) : (
                      <p className="mt-1 text-sm font-medium text-gray-300">
                        {profile.phone || "Not set"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-10 w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-white/10 disabled:opacity-50"
              >
                {saving ? "Saving..." : isEditing ? "Save Profile" : "Edit Identity"}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10 lg:col-span-8"
          >
            <div className="flex gap-8 border-b border-white/10">
              {["overview", "preferences"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    activeTab === tab
                      ? "text-cyan-400"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
                    />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                      <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-500">
                        Contact Info
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-gray-600">Email</label>
                          <p className="mt-1 text-sm">{profile.email}</p>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-gray-600">Mobile</label>
                          <p className="mt-1 text-sm">{profile.phone || "Not set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                      <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-500">
                        Quick Stats
                      </h4>
                      <p className="text-sm text-gray-400">
                        Visit your{" "}
                        <a href="/dashboard" className="text-cyan-400 underline underline-offset-4">
                          dashboard
                        </a>{" "}
                        to see live stats from your verifications, reviews, and resume scans.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "preferences" && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 gap-8 md:grid-cols-2"
                >
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
                    <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-500">
                      Career Targets
                    </h4>
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-600">
                          Preferred Work Model
                        </label>
                        {isEditing ? (
                          <select
                            name="preferences.location"
                            value={profile.preferences?.location || "Remote"}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-2 text-sm text-cyan-400"
                          >
                            <option>Remote</option>
                            <option>Hybrid</option>
                            <option>On-site</option>
                          </select>
                        ) : (
                          <p className="mt-1 text-sm">{profile.preferences?.location || "Remote"}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-600">
                          Target Domain
                        </label>
                        {isEditing ? (
                          <input
                            name="preferences.domain"
                            value={profile.preferences?.domain || ""}
                            onChange={handleChange}
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-2 text-sm focus:outline-none"
                            placeholder="e.g. Fullstack Development"
                          />
                        ) : (
                          <p className="mt-1 text-sm font-medium text-cyan-400">
                            {profile.preferences?.domain || "Not set"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
