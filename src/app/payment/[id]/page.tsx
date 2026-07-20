"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Clock, XCircle, Copy } from "lucide-react";
import styles from "./page.module.css";

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  payment_method: string;
  details: {
    items: { product: { name: string; images: string[]; price: number }; quantity: number; variation?: any }[];
    service_fee: number;
    saldo_used: number;
  };
  created_at: string;
}

interface PaymentAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
  qr_image_url: string | null;
}

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  const { supabaseUser } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number; expired: boolean } | null>(null);

  useEffect(() => {
    fetchTransaction();
  }, [params.id]);

  useEffect(() => {
    if (!transaction || transaction.status !== "pending") return;

    const timer = setInterval(() => {
      const createdTime = new Date(transaction.created_at).getTime();
      const expiryTime = createdTime + 24 * 60 * 60 * 1000; // 24 hours
      const now = new Date().getTime();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0, expired: true });
        clearInterval(timer);
        
        if (transaction.status === "pending") {
           supabase.from("transactions").update({ status: "rejected" }).eq("id", transaction.id).then(async () => {
              setTransaction({...transaction, status: "rejected"});
              if (transaction.type === "order" && transaction.details?.items) {
                for (const item of transaction.details.items) {
                  const prodId = (item as any).product?.id || (item as any).id;
                  const quantity = item.quantity || 1;
                  if (prodId) {
                    const { data: currentProduct } = await supabase.from("products").select("stock, sold").eq("id", prodId).single();
                    if (currentProduct) {
                      await supabase.from("products").update({
                        stock: (currentProduct.stock || 0) + quantity,
                        sold: Math.max(0, (currentProduct.sold || 0) - quantity)
                      }).eq("id", prodId);
                    }
                  }
                }
              }
           });
        }
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000),
          expired: false
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [transaction]);

  const fetchTransaction = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!error && data) {
        setTransaction(data);
        // Fetch the payment account info
        const { data: accData } = await supabase
          .from("payment_accounts")
          .select("bank_name, account_number, account_holder, qr_image_url")
          .ilike("bank_name", data.payment_method)
          .eq("is_active", true)
          .single();
        setPaymentAccount(accData || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n).replace(/\s/g, "");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shortRef = transaction?.id.slice(0, 12) || "";
  const isQris = transaction?.payment_method?.toLowerCase().includes("qris");

  const statusConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
    pending: { icon: <Clock size={18} />, label: "Menunggu Pembayaran", color: "#92400e", bg: "#fef3c7" },
    approved: { icon: <CheckCircle size={18} />, label: "Pembayaran Dikonfirmasi", color: "#065f46", bg: "#d1fae5" },
    rejected: { icon: <XCircle size={18} />, label: "Ditolak", color: "#991b1b", bg: "#fee2e2" },
  };
  const statusInfo = statusConfig[transaction?.status || "pending"];

  if (isLoading) {
    return (
      <div style={{ background: "var(--bg-main)", minHeight: "100vh" }}>
        <Header />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <p style={{ color: "var(--text-muted)" }}>Memuat detail pembayaran...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div style={{ background: "var(--bg-main)", minHeight: "100vh" }}>
        <Header />
        <div style={{ maxWidth: 700, margin: "60px auto", padding: 20, textAlign: "center" }}>
          <h2 style={{ color: "var(--text-main)" }}>Transaksi tidak ditemukan</h2>
          <Link href="/" style={{ color: "var(--primary)" }}>Kembali ke Beranda</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const subtotal = transaction.amount - (transaction.details?.service_fee || 0);
  const items = transaction.details?.items || [];
  const totalItems = items.reduce((acc: number, i: any) => acc + i.quantity, 0);

  return (
    <div style={{ background: "var(--bg-main)", minHeight: "100vh" }}>
      <Header />
      <div className={styles.container}>

        {/* Status Bar */}
        <div className={`${styles.card} ${styles.statusBar}`}>
          <div className={styles.statusLeft}>
            <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: "600" }}>Status Pembayaran :</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: statusInfo.bg, color: statusInfo.color, fontWeight: "700", fontSize: 13 }}>
              {statusInfo.icon}
              {statusInfo.label.toUpperCase()}
            </span>
          </div>
          {transaction.status === "pending" && (
            <button style={{ padding: "10px 20px", background: "var(--primary)", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "default" }}>
              Menunggu Konfirmasi Admin
            </button>
          )}
          {transaction.status === "approved" && (
            <span style={{ color: "#065f46", fontWeight: "bold", fontSize: 14 }}>✓ Pembayaran Dikonfirmasi!</span>
          )}
        </div>

        {/* Reference & Summary */}
        <div className={styles.card}>
          <div className={styles.refGrid}>
            <div>
              <p style={{ fontSize: 11, fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Reference</p>
              <p style={{ fontSize: 14, fontWeight: "700", color: "var(--text-main)", fontFamily: "monospace", wordBreak: "break-all" }}>#{transaction.id}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>{transaction.type === "topup" ? "Jumlah Tagihan Top Up" : "Jumlah Tagihan"}</p>
              <p style={{ fontSize: 16, fontWeight: "700", color: "var(--primary)" }}>{formatPrice(transaction.amount - (transaction.details?.saldo_used || 0))}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Metode Pembayaran</p>
              <p style={{ fontSize: 14, fontWeight: "700", color: "var(--text-main)" }}>{transaction.payment_method} - Manual</p>
            </div>
          </div>

          <div className={styles.detailsGrid}>
            {/* Status Steps */}
            <div>
              <p style={{ fontSize: 13, fontWeight: "700", color: "var(--text-main)", marginBottom: 12 }}>Status Pembayaran</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 14, fontWeight: "600", color: "var(--primary)" }}>Pesanan Dibuat</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: transaction.status === "approved" ? "var(--primary)" : "var(--bg-input)", border: "2px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", color: transaction.status === "approved" ? "white" : "var(--text-muted)", fontSize: 12, flexShrink: 0 }}>2</div>
                  <span style={{ fontSize: 14, color: transaction.status === "approved" ? "var(--primary)" : "var(--text-muted)", fontWeight: transaction.status === "approved" ? "600" : "400" }}>
                    Pembayaran Dikonfirmasi
                  </span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <p style={{ fontSize: 13, fontWeight: "700", color: "var(--text-main)", marginBottom: 12 }}>{transaction.type === "topup" ? "Detail Top Up" : "Detail Pesanan"}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {transaction.type !== "topup" && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Total Item</span>
                    <span style={{ color: "var(--text-main)" }}>: {totalItems} item</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>Sub Total</span>
                  <span style={{ color: "var(--primary)", fontWeight: "600" }}>: {formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>Biaya Layanan</span>
                  <span style={{ color: "var(--primary)", fontWeight: "600" }}>: {formatPrice(transaction.details?.service_fee || 0)}</span>
                </div>
                {(transaction.details?.saldo_used || 0) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Saldo Digunakan</span>
                    <span style={{ color: "#ef4444", fontWeight: "600" }}>: -{formatPrice(transaction.details.saldo_used)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: "700", paddingTop: 6, borderTop: "1px solid var(--border-color)", marginTop: 4 }}>
                  <span style={{ color: "var(--text-main)" }}>Total Tagihan</span>
                  <span style={{ color: "var(--primary)" }}>: {formatPrice(transaction.amount - (transaction.details?.saldo_used || 0))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Instructions */}
        {transaction.status === "pending" && (
          <div className={styles.card}>
            <h3 style={{ fontSize: 15, fontWeight: "700", color: "var(--text-main)", marginBottom: 16 }}>
              📋 Instruksi Pembayaran
            </h3>

            {isQris && paymentAccount?.qr_image_url ? (
              // QR Code display
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 20 }}>
                <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center" }}>Scan QR Code berikut menggunakan aplikasi pembayaran Anda:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={paymentAccount.qr_image_url} alt="QRIS" className={styles.qrImage} />
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Merchant: <strong>{paymentAccount.account_holder}</strong></p>
                <div style={{ padding: "10px 20px", background: "rgba(16,185,129,0.07)", borderRadius: 8, border: "1px solid var(--primary)" }}>
                  <p style={{ fontSize: 15, fontWeight: "700", color: "var(--primary)", textAlign: "center" }}>Total: {formatPrice(transaction.amount)}</p>
                </div>
              </div>
            ) : paymentAccount ? (
              // Bank Transfer details
              <div style={{ background: "rgba(16,185,129,0.05)", border: "1.5px solid var(--primary)", borderRadius: 10, padding: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Bank</span>
                    <span style={{ fontWeight: "700", fontSize: 15 }}>{paymentAccount.bank_name} - Manual</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Nomor Rekening</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: 18, color: "var(--primary)", letterSpacing: "0.05em", wordBreak: "break-all" }}>{paymentAccount.account_number}</span>
                      <button onClick={() => copyToClipboard(paymentAccount.account_number)} title="Salin" style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: copied ? "var(--primary)" : "var(--text-muted)" }}>
                        {copied ? "✓" : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Nama Akun</span>
                    <span style={{ fontWeight: "600", fontSize: 14 }}>{paymentAccount.account_holder}</span>
                  </div>
                  <div style={{ marginTop: 8, padding: "10px 16px", background: "var(--bg-main)", borderRadius: 8, textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Silakan transfer tepat sebesar</p>
                    <p style={{ fontSize: 20, fontWeight: "700", color: "var(--primary)" }}>{formatPrice(transaction.amount)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 20, padding: "12px 16px", background: "#fef3c7", borderRadius: 8, display: "flex", gap: 10 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.5, margin: 0 }}>Setelah transfer, pembayaran akan dikonfirmasi oleh Admin. Jangan tutup halaman ini sebelum mendapatkan konfirmasi.</p>
            </div>
            
            {timeLeft && !timeLeft.expired && (
              <div style={{ marginTop: 24, textAlign: "center", borderTop: "1px dashed var(--border-color)", paddingTop: 20 }}>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                  Pembayaran akan kadaluarsa pada {new Date(new Date(transaction.created_at).getTime() + 24 * 60 * 60 * 1000).toLocaleString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'})}
                </p>
                <p style={{ fontSize: 16, fontWeight: "700", color: "#ef4444" }}>
                  {timeLeft.d > 0 && `${timeLeft.d} hari `}{timeLeft.h} jam {timeLeft.m} menit {timeLeft.s} detik tersisa
                </p>
              </div>
            )}
          </div>
        )}

        {/* Ordered Items List */}
        {transaction.type !== "topup" && items.length > 0 && (
          <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
            <div className={styles.orderItemRow} style={{ borderBottom: "1px solid var(--border-color)", padding: "16px 24px", background: "var(--bg-main)" }}>
              <span style={{ fontSize: 13, fontWeight: "600", color: "var(--text-muted)" }}>Item</span>
              <span style={{ fontSize: 13, fontWeight: "600", color: "var(--text-muted)", textAlign: "center", display: "none" }}>Quantity</span>
              <span style={{ fontSize: 13, fontWeight: "600", color: "var(--text-muted)", textAlign: "right" }}>Harga</span>
            </div>
            
            <div style={{ padding: "0 24px" }}>
              {items.map((item: any, idx: number) => {
                const prod = item.product || { name: item.name, images: [] };
                return (
                  <div key={idx} className={styles.orderItemRow} style={{ borderBottom: idx !== items.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      {prod.images?.[0] ? (
                        <img src={prod.images[0]} alt={prod.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: "var(--border-color)", flexShrink: 0 }} />
                      )}
                      <div>
                        <p style={{ fontWeight: "600", fontSize: 14, color: "var(--text-main)", marginBottom: 4, wordBreak: "break-word" }}>{prod.name}</p>
                        {item.variation && (
                          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4, wordBreak: "break-word" }}>{item.variation.name}</p>
                        )}
                        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Qty: {item.quantity}</p>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 14, color: "var(--text-main)", fontWeight: "500", textAlign: "right" }}>
                      {formatPrice((item.variation?.price || prod.price) * item.quantity)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Expired Message */}
        {transaction.status === "rejected" && (
           <div style={{ background: "var(--bg-card)", border: "1px solid var(--danger)", borderRadius: 12, padding: "20px 24px", marginBottom: 20, textAlign: "center" }}>
             <h3 style={{ fontSize: 16, fontWeight: "700", color: "var(--danger)", marginBottom: 8 }}>Pesanan Dibatalkan / Kadaluarsa</h3>
             <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Waktu pembayaran untuk pesanan ini telah habis (24 jam) atau dibatalkan oleh Admin.</p>
           </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
