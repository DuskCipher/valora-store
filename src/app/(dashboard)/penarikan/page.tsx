"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

export default function PenarikanPage() {
  const { supabaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Minta Penarikan");
  const [agreed, setAgreed] = useState(false);
  const tabs = ["Riwayat Penarikan", "Minta Penarikan"];

  // Form state
  const [bankName, setBankName] = useState("BCA");
  const [accountHolder, setAccountHolder] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [accountNumber, setAccountNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data state
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (supabaseUser) {
      fetchData();
    }
  }, [supabaseUser]);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", supabaseUser?.id)
      .single();
    if (profile) setBalance(profile.balance || 0);

    // Fetch withdrawal history
    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", supabaseUser?.id)
      .eq("type", "withdraw")
      .order("created_at", { ascending: false });
    if (txs) setHistory(txs);

    setIsLoading(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price).replace(/\s/g, "");

  const handleSubmit = async () => {
    if (!supabaseUser) return;
    if (!accountHolder.trim()) {
      alert("Silakan isi nama pemilik rekening.");
      return;
    }
    if (!accountNumber.trim()) {
      alert("Silakan isi nomor rekening.");
      return;
    }
    if (amount < 10000) {
      alert("Minimal penarikan adalah Rp10.000.");
      return;
    }
    if (amount > balance) {
      alert("Saldo Anda tidak mencukupi untuk penarikan ini.");
      return;
    }
    if (!agreed) {
      alert("Anda harus menyetujui syarat dan ketentuan terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: supabaseUser.id,
        type: "withdraw",
        amount: amount,
        status: "pending",
        payment_method: bankName,
        details: {
          account_holder: accountHolder,
          account_number: accountNumber,
          bank_name: bankName,
        },
      });

      if (error) throw error;

      alert("Permintaan penarikan berhasil dibuat! Silakan tunggu konfirmasi dari Admin.");
      // Reset form
      setAccountHolder("");
      setAmount(0);
      setAccountNumber("");
      setAgreed(false);
      // Refresh data
      await fetchData();
      setActiveTab("Riwayat Penarikan");
    } catch (err: any) {
      alert("Gagal memproses penarikan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved": return { label: "Disetujui", color: "#065f46", bg: "#d1fae5", icon: <CheckCircle size={14} /> };
      case "rejected": return { label: "Ditolak", color: "#991b1b", bg: "#fee2e2", icon: <XCircle size={14} /> };
      default: return { label: "Menunggu", color: "#92400e", bg: "#fef3c7", icon: <Clock size={14} /> };
    }
  };

  const totalWithdrawn = history.filter(t => t.status === 'approved').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Penarikan</h1>
        <p className={styles.subtitle}>Kelola dan riwayat penarikan dana Anda</p>
      </header>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Minta Penarikan" && (
        <div className={styles.formLayout}>
          {/* Left: Form */}
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Bank Name</label>
              <select className={styles.formSelect} value={bankName} onChange={(e) => setBankName(e.target.value)}>
                <option value="BCA">BCA</option>
                <option value="BRI">BRI</option>
                <option value="BNI">BNI</option>
                <option value="Mandiri">Mandiri</option>
                <option value="BSI">BSI</option>
                <option value="Bank Jago">Bank Jago</option>
                <option value="SeaBank">SeaBank</option>
                <option value="QRIS">QRIS</option>
                <option value="DANA">DANA</option>
                <option value="GoPay">GoPay</option>
                <option value="OVO">OVO</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nama Pemilik Rekening</label>
              <input type="text" className={styles.formInput} placeholder="Masukkan nama pemilik rekening" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Jumlah (Min. Rp10.000)</label>
              <input type="number" className={styles.formInput} placeholder="Contoh: 50000" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nomor Rekening</label>
              <input type="text" className={styles.formInput} placeholder="Masukkan nomor rekening" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </div>

            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="agree" className={styles.checkboxLabel}>
                Saya bertanggung jawab atas kerugian akibat detail rekening bank yang salah
              </label>
            </div>

            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting || !agreed || amount < 10000 || amount > balance}
              style={{
                opacity: (isSubmitting || !agreed || amount < 10000 || amount > balance) ? 0.5 : 1,
                cursor: (isSubmitting || !agreed || amount < 10000 || amount > balance) ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Memproses..." : "Minta Penarikan"}
            </button>
          </div>

          {/* Right: Saldo Card */}
          <div className={styles.saldoCard}>
            <div className={styles.saldoIconRow}>
              <div className={styles.saldoIcon}>
                <DollarSign size={20} color="#475569" />
              </div>
              <div className={styles.saldoAmountBlock}>
                <span className={styles.saldoAmount}>{formatPrice(balance)}</span>
                <span className={styles.saldoCount}>{history.length}</span>
              </div>
            </div>
            <h3 className={styles.saldoTitle}>Total saldo Anda</h3>
            <p className={styles.saldoDesc}>
              Ini adalah total saldo Anda yang dapat Anda tarik. Pastikan detail rekening bank Anda terbaru sebelum memulai permintaan penarikan.
            </p>
            {totalWithdrawn > 0 && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 12 }}>
                Total sudah ditarik: <strong style={{ color: "var(--primary)" }}>{formatPrice(totalWithdrawn)}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === "Riwayat Penarikan" && (
        <div style={{ marginTop: '24px' }}>
          {isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>Memuat data...</div>
          ) : history.length > 0 ? (
            <div style={{ background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border-color)", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-main)" }}>
                    <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Tanggal</th>
                    <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Bank</th>
                    <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>No. Rekening</th>
                    <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Nominal</th>
                    <th style={{ padding: 16, borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(t => {
                    const statusInfo = getStatusInfo(t.status);
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: 16, fontSize: 14 }}>{new Date(t.created_at).toLocaleString('id-ID')}</td>
                        <td style={{ padding: 16, fontSize: 14, fontWeight: "600" }}>{t.details?.bank_name || t.payment_method}</td>
                        <td style={{ padding: 16, fontSize: 14, fontFamily: "monospace" }}>{t.details?.account_number || "-"}</td>
                        <td style={{ padding: 16, fontWeight: "600", color: "var(--danger)" }}>-{formatPrice(t.amount)}</td>
                        <td style={{ padding: 16 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "4px 10px", borderRadius: 20,
                            backgroundColor: statusInfo.bg, color: statusInfo.color,
                            fontWeight: "bold", fontSize: 12,
                          }}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Anda tidak memiliki Data"
              description="Yeah, Anda belum memiliki riwayat penarikan"
            />
          )}
        </div>
      )}
    </div>
  );
}
