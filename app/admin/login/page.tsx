"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabaseAuth } from "@/lib/supabase-auth";
import { adminFonts } from "../fonts";
import "../admin.css";

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
    <main className={`admin-app login-screen ${adminFonts}`}>
      {/* Fondo a pantalla completa */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/fondo.jpg" alt="" aria-hidden="true" className="login-bg" />
      <div className="login-overlay" />

      <div className="login-card">
        <div className="brand">
          <span className="logo has-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpeg" alt="Yoan BarberShop" />
          </span>
          <div>
            <strong>Yoan BarberShop</strong>
            <span>Panel del barbero</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Correo</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="barbero@correo.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="form-field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="alert alert-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="primary-button full"
            style={{ marginTop: 6 }}
          >
            {submitting && <Loader2 className="animate-spin" size={16} />}
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
