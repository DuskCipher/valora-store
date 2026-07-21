"use client";

import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, ChevronDown, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./AuthModal.module.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot_password">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("+62");
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // MFA Login State
  const [isMfaMode, setIsMfaMode] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => {
    if (isOpen) {
      const savedEmail = localStorage.getItem("rememberedEmail");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      } else {
        setRememberMe(false);
      }
      setMode("login");
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.data.id,
        code: mfaCode,
      });

      if (verify.error) throw verify.error;

      // 2FA Successful
      setIsMfaMode(false);
      onLogin();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Kode 2FA salah.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isMfaMode) {
      return handleMfaSubmit(e);
    }

    setErrorMsg("");
    setIsLoading(true);

    try {
      if (mode === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        alert("Tautan pemulihan kata sandi telah dikirim ke email Anda!");
        setMode("login");
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error("Password dan konfirmasi password tidak cocok!");
        }
        if (!agreeTerms) {
          throw new Error("Anda harus menyetujui Syarat Layanan dan Kebijakan Privasi.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              username: username,
              phone: phone,
            },
          },
        });

        if (error) throw error;
        alert("Pendaftaran berhasil! Silakan cek email Anda (jika konfirmasi email aktif) atau langsung masuk.");
        setMode("login");
      } else {
        // Login mode
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        // Check if MFA is required
        if (data.session && data.user) {
          // Get the AAL level
          const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalError) throw aalError;

          if (aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
            // User needs to perform 2FA
            const { data: factorsData } = await supabase.auth.mfa.listFactors();
            const activeFactor = factorsData?.totp.find(f => f.status === 'verified');
            
            if (activeFactor) {
              setMfaFactorId(activeFactor.id);
              setIsMfaMode(true);
              setIsLoading(false);
              return; // Stop here, wait for MFA code input
            }
          }
        }
        
        // If no MFA required or already completed
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        onLogin();
        onClose();
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={22} />
        </button>

        <h2 className={styles.title}>
          {mode === "forgot_password" ? "Lupa Kata Sandi" : "Selamat Datang Kembali"}
        </h2>

        {mode === "login" ? (
          <p className={styles.subtitle}>
            Bergabung Sekarang{" "}
            <button className={styles.switchLink} onClick={() => setMode("register")}>
              Buat akun
            </button>
          </p>
        ) : mode === "register" ? (
          <p className={styles.subtitle}>
            Sudah punya akun?{" "}
            <button className={styles.switchLink} onClick={() => setMode("login")}>
              Masuk
            </button>
          </p>
        ) : (
          <p className={styles.subtitle}>
            Ingat kata sandi?{" "}
            <button className={styles.switchLink} onClick={() => setMode("login")}>
              Masuk
            </button>
          </p>
        )}

        {mode !== "forgot_password" && (
          <button className={styles.googleBtn}>
            <span className={styles.googleIcon}>G</span>
            Masuk dengan Google
          </button>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isMfaMode ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Shield size={48} color="#10b981" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Verifikasi Dua Langkah</h3>
              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
                Masukkan 6 digit kode dari aplikasi authenticator Anda.
              </p>
              
              <div className={styles.field}>
                <input
                  type="text"
                  maxLength={6}
                  className={styles.input}
                  placeholder="Kode 6 digit"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  style={{ fontSize: "24px", letterSpacing: "8px", textAlign: "center", padding: "16px" }}
                />
              </div>
            </div>
          ) : (
            <>
              {mode === "register" && (
                <div className={styles.rowFields}>
                  <div className={styles.field}>
                    <label className={styles.label}>Full Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Username</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {mode !== "forgot_password" && (
                <div className={styles.field}>
                  <label className={styles.label}>Password</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={styles.input}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "register" && (
                <>
                  <div className={styles.field}>
                    <label className={styles.label}>Konfirmasi Kata Sandi</label>
                    <div className={styles.inputWrapper}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={styles.input}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Telepon</label>
                    <div className={styles.phoneWrapper}>
                      <div className={styles.phoneCountry}>
                        <img
                          src="https://flagcdn.com/w20/id.png"
                          alt="ID"
                          width={20}
                          height={14}
                          style={{ borderRadius: "2px" }}
                        />
                        <ChevronDown size={14} />
                      </div>
                      <input
                        type="tel"
                        className={`${styles.input} ${styles.phoneInput}`}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === "login" ? (
                <div className={styles.rememberRow}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={styles.checkbox}
                    />
                    Remember me
                  </label>
                  <button type="button" className={styles.forgotLink} onClick={() => setMode("forgot_password")}>
                    Lupa Kata Sandi?
                  </button>
                </div>
              ) : mode === "register" ? (
                <label className={styles.checkboxLabel} style={{ marginTop: "8px" }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>
                    Saya setuju dengan{" "}
                    <a href="#" className={styles.termsLink}>Syarat Layanan</a> dan{" "}
                    <a href="#" className={styles.termsLink}>Kebijakan Privasi</a>.
                  </span>
                </label>
              )}
            </>
          )}

          {errorMsg && (
            <div style={{ color: "#ef4444", fontSize: "13px", marginBottom: "16px", padding: "10px", backgroundColor: "#fef2f2", borderRadius: "6px" }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? "Memproses..." : (isMfaMode ? "Verifikasi" : mode === "forgot_password" ? "Kirim Tautan" : (mode === "login" ? "Masuk" : "Daftar"))}
          </button>
        </form>
      </div>
    </>
  );
};
