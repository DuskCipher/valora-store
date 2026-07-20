"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const savedPassword = localStorage.getItem("zaystore_admin_password") || "admin123";
    
    if (password === savedPassword) {
      localStorage.setItem("zaystore_admin_auth", "true");
      router.push("/admin");
    } else {
      setError("Password salah! Silakan coba lagi.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)", padding: 20 }}>
      <div style={{ background: "var(--bg-card)", padding: 40, borderRadius: 16, width: "100%", maxWidth: 400, border: "1px solid var(--border-color)", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", textAlign: "center" }}>
        
        <div style={{ width: 60, height: 60, background: "rgba(16, 185, 129, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Lock size={28} color="var(--primary)" />
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: "bold", color: "var(--text-main)", marginBottom: 8 }}>Admin Login</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 30 }}>Masukkan password untuk masuk ke dashboard admin utama.</p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <input
              type="password"
              placeholder="Masukkan Password..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: error ? "1.5px solid var(--danger)" : "1.5px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: 15, boxSizing: "border-box", outline: "none" }}
              autoFocus
            />
            {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8, textAlign: "left" }}>{error}</p>}
          </div>

          <button 
            type="submit"
            style={{ width: "100%", padding: "14px", background: "var(--primary)", color: "white", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer", marginTop: 10 }}
          >
            Masuk ke Dashboard
          </button>
        </form>

        <button 
          onClick={() => router.push("/")}
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 14, marginTop: 24, cursor: "pointer", textDecoration: "underline" }}
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
