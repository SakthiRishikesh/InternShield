"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import CyberBackground from "@/components/common/CyberBackground";

export default function Home() {
  const router = useRouter();
  const howItWorksRef = useRef(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const steps = [
    {
      title: "Data Input",
      desc: "Capture internship offer details via text or document upload. We support PDFs, emails, and job descriptions.",
      icon: "📥",
    },
    {
      title: "AI Analysis",
      desc: "Our AI analysis detects patterns, verifies domain validity, and checks signature authenticity across global databases.",
      icon: "🧠",
    },
    {
      title: "Community Validation",
      desc: "Real-time cross-referencing with Reddit, Glassdoor, and community-driven scam reports for live feedback.",
      icon: "🌍",
    },
    {
      title: "Risk Verdict",
      desc: "Get a comprehensive trust report with a calculated safety percentage and actionable risk breakdown.",
      icon: "🛡️",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 font-sans scroll-smooth">
      <CyberBackground />
      <Navbar />

      <main className="relative z-10 flex flex-col items-center px-6">
        {/* HERO SECTION */}
        <section className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase border border-cyan-500/30 rounded-full bg-cyan-500/10 text-cyan-400 backdrop-blur-md"
            >
              AI-Powered trust layer
            </motion.div>

            <h1 className="text-6xl md:text-8xl font-serif font-black mb-8 leading-tight tracking-tighter">
              Secure Your <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Career Path.
              </span>
            </h1>

            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              InternShield leverages advanced neural signatures to verify internship offers, shielding you from deceptive opportunities.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/verify")}
                className="group relative px-8 py-4 bg-cyan-500 text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
              >
                <span className="relative z-10">Start Verification</span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl"></div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToHowItWorks}
                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all font-serif"
              >
                How it Works
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-12 text-center w-full"
          >
            {[
              { label: "Verified Offers", val: "1.2k+" },
              { label: "Safety Rating", val: "99.9%" },
              { label: "AI Latency", val: "< 2s" },
              { label: "Global Reach", val: "50+ Countries" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-white">{stat.val}</span>
                <span className="text-xs uppercase tracking-widest text-gray-500 font-medium">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section
          ref={howItWorksRef}
          className="py-32 w-full max-w-6xl"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our multi-layered verification engine ensures every offer is authentic through advanced neural scanning and community intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-cyan-500/50 transition-colors group"
              >
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{step.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-cyan-400">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}