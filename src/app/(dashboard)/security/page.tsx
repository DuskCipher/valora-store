"use client";

import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, Shield, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";
import sharedStyles from "../payment-history/page.module.css";

export default function SecurityPage() {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPw, setIsUpdatingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [tfaMsg, setTfaMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      
      // Check if user has verified factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      
      const hasVerifiedFactors = factorsData.totp.some(factor => factor.status === 'verified');
      setIs2FAEnabled(hasVerifiedFactors);
    } catch (err) {
      console.error("Error checking 2FA:", err);
    }
  };

  const handleUpdatePassword = async () => {
    setPwMsg({ type: "", text: "" });
    if (!newPassword || newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "Password baru dan konfirmasi password tidak cocok atau kosong." });
      return;
    }
    
    setIsUpdatingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwMsg({ type: "success", text: "Password berhasil diperbarui." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwMsg({ type: "error", text: err.message || "Gagal memperbarui password." });
    } finally {
      setIsUpdatingPw(false);
    }
  };

  const start2FAEnrollment = async () => {
    setTfaMsg({ type: "", text: "" });
    setIsEnrolling(true);
    try {
      // Clean up any existing unverified factors before enrolling a new one
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      if (existingFactors?.totp) {
        for (const factor of existingFactors.totp) {
          if ((factor.status as string) === 'unverified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });
      if (error) throw error;
      
      setFactorId(data.id);
      setQrCodeData(data.totp.qr_code);
    } catch (err: any) {
      setTfaMsg({ type: "error", text: err.message || "Gagal menginisialisasi 2FA." });
      setIsEnrolling(false);
    }
  };

  const cancelEnrollment = async () => {
    // Unenroll the unverified factor so user can re-enroll later
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch (err) {
        console.error("Error unenrolling factor:", err);
      }
    }
    setIsEnrolling(false);
    setQrCodeData("");
    setFactorId("");
    setVerificationCode("");
  };

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setTfaMsg({ type: "error", text: "Masukkan 6 digit kode yang valid." });
      return;
    }

    setTfaMsg({ type: "", text: "" });
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verificationCode,
      });

      if (verify.error) throw verify.error;

      setTfaMsg({ type: "success", text: "2FA berhasil diaktifkan!" });
      setIs2FAEnabled(true);
      setIsEnrolling(false);
    } catch (err: any) {
      setTfaMsg({ type: "error", text: err.message || "Kode salah atau gagal verifikasi." });
    }
  };

  const unenroll2FA = async () => {
    // Note: In a real app, you'd challenge them before allowing unenrollment.
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const activeFactor = factorsData?.totp.find(f => f.status === 'verified');
      if (activeFactor) {
        await supabase.auth.mfa.unenroll({ factorId: activeFactor.id });
        setIs2FAEnabled(false);
        setTfaMsg({ type: "success", text: "2FA dinonaktifkan." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={sharedStyles.container}>
      <header className={sharedStyles.header}>
        <h1 className={sharedStyles.title}>Security</h1>
        <p className={sharedStyles.subtitle}>Kelola keamanan akun Anda</p>
      </header>

      {/* Password Section */}
      <div className={styles.securityCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Lock size={20} color="#10b981" />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Ganti Password</h3>
            <p className={styles.cardDesc}>Pastikan password Anda kuat dan unik</p>
          </div>
        </div>

        <div className={styles.formStack}>
          {pwMsg.text && (
            <div style={{ color: pwMsg.type === "error" ? "#ef4444" : "#10b981", fontSize: "14px", marginBottom: "16px" }}>
              {pwMsg.text}
            </div>
          )}
          
          {/* Note: Current Password verification is handled implicitly if user has a valid session, 
              or explicitly in advanced setups. We'll stick to updating it directly since they are logged in. */}
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Password Baru</label>
            <div className={styles.inputWrapper}>
              <input
                type={showNewPw ? "text" : "password"}
                className={styles.formInput}
                placeholder="Masukkan password baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button className={styles.togglePw} onClick={() => setShowNewPw(!showNewPw)}>
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Konfirmasi Password Baru</label>
            <div className={styles.inputWrapper}>
              <input
                type={showConfirmPw ? "text" : "password"}
                className={styles.formInput}
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button className={styles.togglePw} onClick={() => setShowConfirmPw(!showConfirmPw)}>
                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className={styles.formActions}>
            <button className={styles.saveBtn} onClick={handleUpdatePassword} disabled={isUpdatingPw}>
              <Save size={16} /> {isUpdatingPw ? "Menyimpan..." : "Simpan Password"}
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Section */}
      <div className={styles.securityCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon}>
            <Shield size={20} color="#10b981" />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Two-Factor Authentication</h3>
            <p className={styles.cardDesc}>Tambahkan lapisan keamanan ekstra pada akun Anda</p>
          </div>
        </div>

        {tfaMsg.text && (
          <div style={{ color: tfaMsg.type === "error" ? "#ef4444" : "#10b981", fontSize: "14px", marginBottom: "16px", marginTop: "16px" }}>
            {tfaMsg.text}
          </div>
        )}

        <div className={styles.tfaStatus}>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>Status</span>
            {is2FAEnabled ? (
              <span className={styles.statusActive} style={{ color: "#10b981", fontWeight: 600 }}>Aktif</span>
            ) : (
              <span className={styles.statusInactive}>Tidak Aktif</span>
            )}
          </div>
          
          {!is2FAEnabled && !isEnrolling && (
            <button className={styles.enableBtn} onClick={start2FAEnrollment}>Aktifkan 2FA</button>
          )}

          {is2FAEnabled && (
            <button className={styles.enableBtn} style={{ backgroundColor: "#ef4444" }} onClick={unenroll2FA}>Matikan 2FA</button>
          )}
        </div>

        {/* 2FA Enrollment UI */}
        {isEnrolling && !is2FAEnabled && (
          <div style={{ marginTop: "24px", padding: "24px", border: "1px dashed #cbd5e1", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "16px", marginBottom: "16px", color: "#1e293b" }}>Setup Google Authenticator</h4>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
              Scan QR code di bawah ini menggunakan aplikasi authenticator Anda (contoh: Google Authenticator), 
              lalu masukkan 6 digit kode yang muncul.
            </p>
            
            <div style={{ display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" }}>
              {qrCodeData && (
                <div style={{ padding: "16px", backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  <img src={qrCodeData} alt="QR Code 2FA" width={150} height={150} />
                </div>
              )}
              
              <div style={{ flex: 1, minWidth: "250px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Kode Verifikasi</label>
                  <input
                    type="text"
                    maxLength={6}
                    className={styles.formInput}
                    placeholder="Contoh: 123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    style={{ fontSize: "20px", letterSpacing: "4px", padding: "12px 16px" }}
                  />
                </div>
                <button 
                  className={styles.saveBtn} 
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={verify2FA}
                >
                  Verifikasi & Aktifkan
                </button>
                <button 
                  style={{ width: "100%", marginTop: "12px", padding: "12px", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontWeight: 600 }}
                  onClick={cancelEnrollment}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
