import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import AuthGate from "./AuthGate";
import Tracker from "./Tracker";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#161b21", color: "#8b95a1", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: 13 }}>
        loading…
      </div>
    );
  }

  if (!session) {
    return <AuthGate />;
  }

  return <Tracker uid={session.user.id} userEmail={session.user.email} onSignOut={() => supabase.auth.signOut()} />;
}
