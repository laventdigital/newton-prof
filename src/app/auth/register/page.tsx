"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    grade: 9,
    city: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            grade: form.grade,
            city: form.city,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        // Create profile
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: form.full_name,
          grade: form.grade,
          city: form.city,
        });

        router.push("/test");
      }
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
            Регистрация
          </h1>
          <p className="text-[#E8E4F0]/60 text-sm">
            Создай аккаунт, чтобы пройти тест и сохранить результат
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
              Имя и фамилия
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-[#0C0A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-[#E8E4F0]/30 focus:outline-none focus:border-[#A855F7] transition-colors"
              placeholder="Айдана Серикова"
            />
          </div>

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
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-[#0C0A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-[#E8E4F0]/30 focus:outline-none focus:border-[#A855F7] transition-colors"
              placeholder="Минимум 6 символов"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#E8E4F0]/80 mb-2">
                Класс
              </label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
                className="w-full bg-[#0C0A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#A855F7] transition-colors"
              >
                <option value={9}>9 класс</option>
                <option value={10}>10 класс</option>
                <option value={11}>11 класс</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E8E4F0]/80 mb-2">
                Город
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-[#0C0A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-[#E8E4F0]/30 focus:outline-none focus:border-[#A855F7] transition-colors"
                placeholder="Астана"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>

          <p className="text-center text-sm text-[#E8E4F0]/50">
            Уже есть аккаунт?{" "}
            <Link href="/auth/login" className="text-[#C084FC] hover:text-[#A855F7] transition-colors">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
