"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-auth";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      console.error("[login] falló la autenticación:", authError);
      setError(
        authError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : authError.message
      );
      setSubmitting(false);
      return;
    }

    // refresh() hace que el middleware vuelva a leer la cookie recién escrita
    router.replace("/admin");
    router.refresh();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      {/* Fondo a pantalla completa */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/fondo.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      />

      <div
        className="relative w-full"
        style={{
          maxWidth: 380,
          backgroundColor: "#111111",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: 16,
          padding: 32,
        }}
      >
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpeg"
            alt="Yoan BarberShop"
            className="mx-auto rounded-xl"
            style={{ width: 80, height: 80, objectFit: "contain" }}
          />
          <p className="mt-4 text-sm font-medium text-primary">
            Panel del barbero
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <label className="mb-1.5 block text-xs text-content/60">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="barbero@correo.com"
            autoComplete="email"
            required
            className="mb-4 w-full rounded-xl border border-edge bg-surface-2 px-4 py-3 text-sm outline-none transition placeholder:text-content/25 focus:border-primary"
          />

          <label className="mb-1.5 block text-xs text-content/60">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="mb-5 w-full rounded-xl border border-edge bg-surface-2 px-4 py-3 text-sm outline-none transition placeholder:text-content/25 focus:border-primary"
          />

          {error && (
            <p className="mb-4 break-words rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
            style={{ backgroundColor: "#C9A84C", color: "#111111" }}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
