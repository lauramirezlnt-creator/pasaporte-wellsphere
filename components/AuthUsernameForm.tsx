"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  isValidUsername,
  usernameErrorMessage,
  isValidPassword,
  passwordErrorMessage,
  usernameToSyntheticEmail,
  normalizeUsername
} from "@/lib/auth-username";

interface AuthUsernameFormProps {
  /** A dónde debe ir el usuario después de iniciar sesión o registrarse. */
  redirectPath: string;
  /** Texto que aparece bajo el botón principal (contexto: check-in o landing). */
  helperText?: string;
}

type Mode = "login" | "signup";
type Status = "idle" | "submitting" | "error";

export function AuthUsernameForm({ redirectPath, helperText }: AuthUsernameFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setErrorMessage(null);
    setStatus("idle");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const normalizedUsername = normalizeUsername(username);

    if (!isValidUsername(normalizedUsername)) {
      setStatus("error");
      setErrorMessage(usernameErrorMessage());
      return;
    }

    if (!isValidPassword(password)) {
      setStatus("error");
      setErrorMessage(passwordErrorMessage());
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setStatus("submitting");

    const supabase = createSupabaseBrowserClient();
    const syntheticEmail = usernameToSyntheticEmail(normalizedUsername);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: {
          data: { username: normalizedUsername }
        }
      });

      if (error) {
        setStatus("error");
        setErrorMessage(
          error.message.toLowerCase().includes("already registered") ||
            error.message.toLowerCase().includes("already exists")
            ? "Ese usuario ya existe. Intenta iniciar sesión en su lugar."
            : "No pudimos crear la cuenta. Intenta con otro usuario."
        );
        return;
      }

      if (!data.session) {
        // Si la confirmación por email sigue activa en el proyecto, no habrá
        // sesión inmediata. Se informa al usuario en lugar de fallar en silencio.
        setStatus("error");
        setErrorMessage(
          "Tu cuenta se creó pero no pudimos iniciar sesión automáticamente. Intenta iniciar sesión con tu usuario y contraseña."
        );
        return;
      }

      router.push(redirectPath);
      router.refresh();
      return;
    }

    // mode === "login"
    const { error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password
    });

    if (error) {
      setStatus("error");
      setErrorMessage("Usuario o contraseña incorrectos.");
      return;
    }

    router.push(redirectPath);
    router.refresh();
  }

  return (
    <div className="wsp-stack">
      <div className="wsp-tabs" role="tablist" style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          className={mode === "login" ? "wsp-btn wsp-btn-primary" : "wsp-btn wsp-btn-ghost"}
          style={{ flex: 1 }}
          onClick={() => switchMode("login")}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={mode === "signup" ? "wsp-btn wsp-btn-primary" : "wsp-btn wsp-btn-ghost"}
          style={{ flex: 1 }}
          onClick={() => switchMode("signup")}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="wsp-stack">
        <div className="wsp-field">
          <label className="wsp-label" htmlFor="username">
            Usuario
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className="wsp-input"
            placeholder="Tu nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={20}
          />
          <span className="wsp-hint">3 a 20 caracteres, sin espacios (puede ser tu nombre).</span>
        </div>

        <div className="wsp-field">
          <label className="wsp-label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="wsp-input"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        {mode === "signup" && (
          <div className="wsp-field">
            <label className="wsp-label" htmlFor="confirmPassword">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="wsp-input"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        )}

        {errorMessage && <p className="wsp-error-text">{errorMessage}</p>}

        <button type="submit" className="wsp-btn wsp-btn-primary" disabled={status === "submitting"}>
          {status === "submitting"
            ? mode === "signup"
              ? "Creando cuenta..."
              : "Ingresando..."
            : mode === "signup"
              ? "Crear cuenta"
              : "Ingresar"}
        </button>

        {helperText && <p className="wsp-hint wsp-text-center">{helperText}</p>}
      </form>
    </div>
  );
}
