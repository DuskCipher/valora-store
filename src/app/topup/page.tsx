"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import checkoutStyles from "../checkout/page.module.css";
import styles from "./page.module.css";

const BANK_TRANSFER_METHODS = [
  { id: "bca", name: "BCA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/200px-Bank_Central_Asia.svg.png", fee: 0 },
  { id: "bri", name: "BRI", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/BANK_BRI_logo.svg/200px-BANK_BRI_logo.svg.png", fee: 0 },
  { id: "bni", name: "BNI", logo: "https://upload.wikimedia.org/wikipedia/id/thumb/5/55/BNI_logo.svg/200px-BNI_logo.svg.png", fee: 0 },
  { id: "mandiri", name: "Mandiri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/200px-Bank_Mandiri_logo_2016.svg.png", fee: 0 },
  { id: "bsi", name: "BSI", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/BSI_logo.svg/200px-BSI_logo.svg.png", fee: 0 },
  { id: "jago", name: "Bank Jago", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Bank_Jago_logo.svg/200px-Bank_Jago_logo.svg.png", fee: 0 },
  { id: "seabank", name: "SeaBank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Seabank_logo.png/200px-Seabank_logo.png", fee: 0 },
];

const EWALLET_METHODS = [
  { id: "qris", name: "QRIS", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_QRIS.svg/200px-Logo_QRIS.svg.png", fee: 0 },
  { id: "dana", name: "DANA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Dana_logo.svg/200px-Dana_logo.svg.png", fee: 0 },
  { id: "gopay", name: "GoPay", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/200px-Gopay_logo.svg.png", fee: 0 },
  { id: "ovo", name: "OVO", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/200px-Logo_ovo_purple.svg.png", fee: 0 },
];

export default function TopUpPage() {
  const router = useRouter();
  const { isLoggedIn, supabaseUser } = useAuth();
  
  const [amount, setAmount] = useState<number>(0);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<{bank_name: string; account_number: string; account_holder: string}[]>([]);

  useEffect(() => {
    supabase
      .from("payment_accounts")
      .select("bank_name, account_number, account_holder")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setPaymentAccounts(data);
      });
  }, []);

  const allMethods = [...BANK_TRANSFER_METHODS, ...EWALLET_METHODS];
  const selectedMethod = allMethods.find((m) => m.id === selectedPayment);

  const handleTopUp = async () => {
    if (!isLoggedIn || !supabaseUser) {
      alert("Silakan login terlebih dahulu!");
      return;
    }
    if (amount < 10000) {
      alert("Minimal top up adalah Rp 10.000");
      return;
    }
    if (!selectedPayment) {
      alert("Silakan pilih metode pembayaran terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from("transactions").insert({
        user_id: supabaseUser.id,
        type: "topup",
        amount: amount,
        status: "pending",
        payment_method: selectedMethod?.name || selectedPayment,
        details: {}
      }).select();

      if (error) throw error;

      if (data && data.length > 0) {
        router.push(`/payment/${data[0].id}`);
      } else {
        router.push("/dashboard/deposit");
      }
    } catch (err: any) {
      alert("Gagal memproses top up: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-main)", minHeight: "100vh" }}>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.title}>Isi Saldo</h1>
        
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 15, fontWeight: "600", color: "var(--text-main)" }}>Nominal Top Up (Min. Rp 10.000)</label>
          <input 
            type="number"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 8, border: "1.5px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)", fontSize: 16, outline: "none", boxSizing: "border-box" }}
            placeholder="Contoh: 50000"
          />
        </div>

        <div className={checkoutStyles.paymentCard} style={{ margin: "0 0 24px 0", border: "none", padding: 0 }}>
          <div style={{ display: "block", marginBottom: 12, fontSize: 15, fontWeight: "600", color: "var(--text-main)" }}>Pilih Metode Pembayaran</div>

          <div className={checkoutStyles.paymentGroupTitle}>Bank Transfer</div>
          <div className={checkoutStyles.paymentGrid}>
            {BANK_TRANSFER_METHODS.map((method) => (
              <button
                key={method.id}
                className={`${checkoutStyles.paymentOption} ${
                  selectedPayment === method.id ? checkoutStyles.paymentOptionActive : ""
                }`}
                onClick={() => setSelectedPayment(method.id)}
                title={method.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={method.logo}
                  alt={method.name}
                  className={checkoutStyles.paymentLogo}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="${checkoutStyles.paymentName}">${method.name}</span>`;
                  }}
                />
              </button>
            ))}
          </div>

          <div className={checkoutStyles.paymentGroupTitle} style={{ marginTop: 16 }}>E-Wallet / QRIS</div>
          <div className={checkoutStyles.paymentGrid}>
            {EWALLET_METHODS.map((method) => (
              <button
                key={method.id}
                className={`${checkoutStyles.paymentOption} ${
                  selectedPayment === method.id ? checkoutStyles.paymentOptionActive : ""
                }`}
                onClick={() => setSelectedPayment(method.id)}
                title={method.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={method.logo}
                  alt={method.name}
                  className={checkoutStyles.paymentLogo}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="${checkoutStyles.paymentName}">${method.name}</span>`;
                  }}
                />
              </button>
            ))}
          </div>

          {/* Account Info Box */}
          {selectedPayment && (() => {
            const selectedMethodName = allMethods.find(m => m.id === selectedPayment)?.name;
            const accountInfo = paymentAccounts.find(acc => acc.bank_name.toLowerCase() === selectedMethodName?.toLowerCase());
            return accountInfo ? (
              <div style={{ marginTop: 20, padding: 16, background: "rgba(16, 185, 129, 0.06)", border: "1.5px solid var(--primary)", borderRadius: 10 }}>
                <p style={{ fontSize: 13, fontWeight: "600", color: "var(--text-muted)", marginBottom: 10 }}>📋 Transfer ke rekening berikut:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Bank / Metode</span>
                    <span style={{ fontWeight: "700", fontSize: 15, color: "var(--text-main)" }}>{accountInfo.bank_name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Nomor Rekening / QRIS</span>
                    <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: 17, color: "var(--primary)", letterSpacing: "0.05em" }}>{accountInfo.account_number}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Atas Nama</span>
                    <span style={{ fontWeight: "600", fontSize: 14, color: "var(--text-main)" }}>{accountInfo.account_holder}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 20, padding: 14, background: "var(--bg-input)", borderRadius: 10, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                ℹ️ Nomor rekening / QRIS belum diisi oleh Admin. Silakan hubungi kami.
              </div>
            );
          })()}
        </div>

        <button 
          onClick={handleTopUp}
          disabled={isSubmitting || !selectedPayment || amount < 10000}
          style={{ 
            width: "100%", 
            padding: 16, 
            background: (isSubmitting || !selectedPayment || amount < 10000) ? "var(--border-color)" : "var(--primary)", 
            color: (isSubmitting || !selectedPayment || amount < 10000) ? "var(--text-muted)" : "white", 
            border: "none", 
            borderRadius: 8, 
            fontWeight: "bold", 
            fontSize: 16,
            cursor: (isSubmitting || !selectedPayment || amount < 10000) ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          {isSubmitting ? "Memproses..." : "Ajukan Isi Saldo"}
        </button>
      </div>
      <Footer />
    </div>
  );
}
