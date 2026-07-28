import React, { useState } from "react";
import { supabase } from "./supabase";
import { Zap, Mail, CheckCircle2 } from "lucide-react";

export default function AuthGate() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
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
      <div style={{ fontSize: 13, color: "#8b95a1", marginTop: 4, marginBottom: 28 }}>KNIT Sultanpur · Dept. of Electrical Engineering</div>

      {sent ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, maxWidth: 280 }}>
          <CheckCircle2 size={26} color="#7fc98f" />
          <div style={{ fontSize: 14, fontWeight: 600, color: "#f2ede4" }}>Check your email</div>
          <div style={{ fontSize: 12.5, color: "#8b95a1" }}>
            We sent a sign-in link to <b>{email}</b>. Open it on this device to log in.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 300 }}>
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
          <button
            type="submit"
            disabled={sending}
            style={{
              background: "#e0a458",
              border: "none",
              borderRadius: 10,
              color: "#161b21",
              padding: "11px 22px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? "Sending…" : "Send sign-in link"}
          </button>
          {error && <div style={{ color: "#e07a5f", fontSize: 12 }}>{error}</div>}
        </form>
      )}

      <div style={{ fontSize: 11, color: "#5c6773", marginTop: 20, maxWidth: 280 }}>
        No password needed. Your attendance data is private to your account and synced across any device you sign in on.
      </div>
    </div>
  );
}
