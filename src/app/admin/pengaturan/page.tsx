"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save } from "lucide-react";

export default function AdminPengaturanPage() {
  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const isAuth = localStorage.getItem("zaystore_admin_auth");
    if (isAuth !== "true") {
      router.push("/admin/login");
    } else {
      setIsAdmin(true);
    }
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const savedPassword = localStorage.getItem("zaystore_admin_password") || "admin123";

    if (currentPassword !== savedPassword) {
      setError("Password lama salah!");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok!");
      return;
    }

    localStorage.setItem("zaystore_admin_password", newPassword);
    setSuccess("Password berhasil diubah!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (isAdmin === null) return <div style={{ padding: 40, color: "var(--text-main)" }}>Loading...</div>;

  return (
    <div style={{ padding: "24px", maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24, color: "var(--text-main)" }}>Pengaturan Admin</h1>
      
      <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)" }}>
        <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: "var(--text-main)" }}>
          <Lock size={20} /> Ganti Password Admin
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
          Ubah password Anda secara berkala demi keamanan. Pastikan Anda mengingat password baru ini untuk mengakses dashboard admin di masa mendatang.
        </p>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: "600", marginBottom: 6, color: "var(--text-main)" }}>Password Lama</label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password lama"
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", outline: "none" }}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: "600", marginBottom: 6, color: "var(--text-main)" }}>Password Baru</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru (min 6 karakter)"
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", outline: "none" }}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: "600", marginBottom: 6, color: "var(--text-main)" }}>Konfirmasi Password Baru</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", outline: "none" }}
              required
            />
          </div>

          {error && <div style={{ color: "var(--danger)", fontSize: 14 }}>{error}</div>}
          {success && <div style={{ color: "var(--primary)", fontSize: 14 }}>{success}</div>}

          <button type="submit" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", marginTop: 8 }}>
            <Save size={18} /> Simpan Password
          </button>
        </form>
      </div>
    </div>
  );
}
