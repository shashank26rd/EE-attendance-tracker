
import React, { useState } from "react";
import { supabase } from "./supabase";
import { Zap, Mail, Lock } from "lucide-react";

export default function AuthGate() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    setError("");
    setInfo("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setBusy(false);
      if (error) {
        setError(error.message);
      } else {
        setInfo("Account created! You're logged in — the app should load in a moment.");
      }
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#161b21",
        color: "#c5cdd6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <Zap size={34} color="#e0a458" fill="#e0a458" />
      <div style={{ fontSize: 18, fontWeight: 800, color: "#f2ede4", marginTop: 14 }}>EE ATTENDANCE TRACKER</div>
      <div style={{ fontSize: 13, color: "#8b95a1", marginTop: 4, marginBottom: 24 }}>KNIT Sultanpur · Dept. of Electrical Engineering</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "#1b2129", borderRadius: 10, padding: 4 }}>
        <button
          onClick={() => { setMode("login"); setError(""); setInfo(""); }}
          style={{
            padding: "7px 18px",
            borderRadius: 8,
            border: "none",
            background: mode === "login" ? "#e0a458" : "transparent",
            color: mode === "login" ? "#161b21" : "#8b95a1",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Log in
        </button>
        <button
          onClick={() => { setMode("signup"); setError(""); setInfo(""); }}
          style={{
            padding: "7px 18px",
            borderRadius: 8,
            border: "none",
            background: mode === "signup" ? "#e0a458" : "transparent",
            color: mode === "signup" ? "#161b21" : "#8b95a1",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1b2129", border: "1px solid #2c3540", borderRadius: 10, padding: "10px 12px" }}>
          <Mail size={16} color="#6b7580" />
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "#f2ede4", fontSize: 14, flex: 1 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1b2129", border: "1px solid #2c3540", borderRadius: 10, padding: "10px 12px" }}>
          <Lock size={16} color="#6b7580" />
          <input
            type="password"
            required
            minLength={6}
            placeholder={mode === "signup" ? "Create a password (min 6 chars)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "#f2ede4", fontSize: 14, flex: 1 }}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          style={{
            background: "#e0a458",
            border: "none",
            borderRadius: 10,
            color: "#161b21",
            padding: "11px 22px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
        {error && <div style={{ color: "#e07a5f", fontSize: 12 }}>{error}</div>}
        {info && <div style={{ color: "#7fc98f", fontSize: 12 }}>{info}</div>}
      </form>

      <div style={{ fontSize: 11, color: "#5c6773", marginTop: 20, maxWidth: 280 }}>
        Your attendance data is private to your account and synced across any device you log in on.
      </div>
    </div>
  );
            }
