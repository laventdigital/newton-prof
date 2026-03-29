"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Неверный email или пароль"
            : signInError.message
        );
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Произошла ошибка. Попробуй ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">🎯</span>
            <span style={{ fontFamily: "var(--font-heading)" }} className="font-bold text-lg text-white">
              Profi<span className="text-[#C084FC]">Test</span> KZ
            </span>
          </Link>
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-2xl font-bold text-white mb-2">
            Вход
          </h1>
          <p className="text-[#E8E4F0]/60 text-sm">
            Войди, чтобы увидеть свои результаты
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#E8E4F0]/80 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#0C0A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-[#E8E4F0]/30 focus:outline-none focus:border-[#A855F7] transition-colors"
              placeholder="aidana@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E8E4F0]/80 mb-2">
              Пароль
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#0C0A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-[#E8E4F0]/30 focus:outline-none focus:border-[#A855F7] transition-colors"
              placeholder="Пароль"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Вход..." : "Войти"}
          </button>

          <p className="text-center text-sm text-[#E8E4F0]/50">
            Нет аккаунта?{" "}
            <Link href="/auth/register" className="text-[#C084FC] hover:text-[#A855F7] transition-colors">
              Зарегистрироваться
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#E8E4F0]/50">Загрузка...</div>}>
      <LoginForm />
    </Suspense>
  );
}
