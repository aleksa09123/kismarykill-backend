"use client";

import { FormEvent, useRef, useState } from "react";

import { loginUser, registerUser, verifyRegistration } from "@/lib/api";
import type { AuthResponse, Gender, PreferredGender } from "@/lib/types";

type AuthMode = "login" | "register";
type RegisterStep = "form" | "verify";

type AuthPanelProps = {
  onAuthenticated: (payload: AuthResponse) => void;
  initialMode?: AuthMode;
  lockMode?: boolean;
};

const COUNTRY_OPTIONS = [
  { code: "GL", name: "Global", flag: "🌍" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪" }
] as const;

export function AuthPanel({ onAuthenticated, initialMode = "login", lockMode = false }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState<string>("GL");
  const [gender, setGender] = useState<Gender>("male");
  const [preferredGender, setPreferredGender] = useState<PreferredGender>("both");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setInfo(null);
    setVerificationCode("");
    setPendingEmail("");
    setRegisterStep("form");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLockRef.current || isSubmitting) {
      return;
    }

    submitLockRef.current = true;
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        if (registerStep === "form") {
          const response = await registerUser({
            email,
            password,
            name: name.trim(),
            country_code: countryCode,
            gender,
            preferred_gender: preferredGender
          });
          setPendingEmail(response.email);
          setRegisterStep("verify");
          setInfo(`${response.detail} Enter the 6-digit code shown in the backend terminal logs.`);
          return;
        }

        const payload = await verifyRegistration({
          email: pendingEmail || email,
          code: verificationCode
        });
        onAuthenticated(payload);
        return;
      }

      const payload = await loginUser({ email, password });
      onAuthenticated(payload);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Authentication failed.";
      setError(message);
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-900/10 backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="font-display text-2xl tracking-tight text-slate-900">Kiss Marry Kill</p>
          <p className="text-sm text-slate-600">Login or create an account to start swiping.</p>
        </div>
      </div>

      {!lockMode && (
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => switchMode("login")}
            className={`min-h-11 rounded-lg text-sm font-semibold transition ${
              mode === "login" ? "bg-white text-slate-900 shadow" : "text-slate-600"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Login
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => switchMode("register")}
            className={`min-h-11 rounded-lg text-sm font-semibold transition ${
              mode === "register" ? "bg-white text-slate-900 shadow" : "text-slate-600"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Register
          </button>
        </div>
      )}

      <form onSubmit={submit} aria-busy={isSubmitting} className="space-y-4">
        {mode === "register" && registerStep === "verify" ? (
          <>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
              Verification email: <span className="font-semibold">{pendingEmail || email}</span>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">6-digit code</span>
              <input
                required
                disabled={isSubmitting}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                pattern="[0-9]{6}"
                className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-900 outline-none ring-orange-500 transition focus:ring disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Enter verification code"
              />
            </label>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setRegisterStep("form");
                setVerificationCode("");
                setInfo(null);
              }}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit registration details
            </button>
          </>
        ) : null}

        {mode === "register" && registerStep === "form" && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
            <input
              required
              type="text"
              disabled={isSubmitting}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-900 outline-none ring-orange-500 transition focus:ring disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Your first name"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
          <input
            required
            type="email"
            disabled={isSubmitting}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-900 outline-none ring-orange-500 transition focus:ring disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
          <input
            required
            minLength={8}
            type="password"
            disabled={isSubmitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-900 outline-none ring-orange-500 transition focus:ring disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Minimum 8 characters"
          />
        </label>

        {mode === "register" && registerStep === "form" && (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Country</span>
              <select
                disabled={isSubmitting}
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none ring-orange-500 transition focus:ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Gender</span>
                <select
                  disabled={isSubmitting}
                  value={gender}
                  onChange={(event) => setGender(event.target.value as Gender)}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none ring-orange-500 transition focus:ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Looking for</span>
                <select
                  disabled={isSubmitting}
                  value={preferredGender}
                  onChange={(event) => setPreferredGender(event.target.value as PreferredGender)}
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none ring-orange-500 transition focus:ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="both">Both</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
            </div>
          </>
        )}

        {info && <p className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700">{info}</p>}
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                  {mode === "register"
                    ? registerStep === "form"
                      ? "Sending verification code..."
                      : "Verifying code..."
                    : "Signing in..."}
                </span>
              )
            : mode === "register"
              ? registerStep === "form"
                ? "Send verification code"
                : "Verify and create account"
              : "Sign in"}
        </button>
      </form>
    </section>
  );
}
