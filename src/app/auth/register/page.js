"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/useAuthStore";

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const { user, initialized, hydrating } = useAuth();
  const { register: registerUser, loading, error, clearError } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (initialized && user) {
      window.location.replace("/dashboard");
    }
  }, [initialized, user]);

  const onSubmit = async (data) => {
    clearError();
    const result = await registerUser(data);

    if (result.success) {
      window.location.assign("/dashboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative z-10 w-full rounded-2xl border border-cyan-500 bg-black/60 p-8 backdrop-blur-lg"
    >
      <h2 className="mb-6 text-center text-3xl font-bold">Create Account</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <input
            {...register("name", {
              required: "Full name is required.",
            })}
            autoComplete="name"
            placeholder="Full Name"
            className="w-full rounded-lg border border-cyan-500 bg-transparent p-3 transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          {errors.name && (
            <p className="text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <input
            {...register("email", {
              required: "Email is required.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address.",
              },
            })}
            type="email"
            autoComplete="email"
            placeholder="Email"
            className="w-full rounded-lg border border-cyan-500 bg-transparent p-3 transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <input
            {...register("password", {
              required: "Password is required.",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters.",
              },
            })}
            type="password"
            autoComplete="new-password"
            placeholder="Password"
            className="w-full rounded-lg border border-cyan-500 bg-transparent p-3 transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password.message}</p>
          )}
        </div>

        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || hydrating}
          className="w-full rounded-lg bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Creating account..."
            : hydrating
              ? "Checking session..."
              : "Register"}
        </button>
      </form>

      <p className="mt-4 text-center text-gray-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-cyan-400 hover:underline">
          Login
        </Link>
      </p>
    </motion.div>
  );
}
