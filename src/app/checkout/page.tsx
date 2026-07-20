"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

// Payment method definitions
const BANK_TRANSFER_METHODS = [
  { id: "bca", name: "BCA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Bank_Central_Asia.svg/200px-Bank_Central_Asia.svg.png", fee: 4000 },
  { id: "bri", name: "BRI", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/BANK_BRI_logo.svg/200px-BANK_BRI_logo.svg.png", fee: 4000 },
  { id: "bni", name: "BNI", logo: "https://upload.wikimedia.org/wikipedia/id/thumb/5/55/BNI_logo.svg/200px-BNI_logo.svg.png", fee: 4000 },
  { id: "mandiri", name: "Mandiri", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Bank_Mandiri_logo_2016.svg/200px-Bank_Mandiri_logo_2016.svg.png", fee: 4000 },
  { id: "bsi", name: "BSI", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/BSI_logo.svg/200px-BSI_logo.svg.png", fee: 4000 },
  { id: "jago", name: "Bank Jago", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Bank_Jago_logo.svg/200px-Bank_Jago_logo.svg.png", fee: 4000 },
  { id: "seabank", name: "SeaBank", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Seabank_logo.png/200px-Seabank_logo.png", fee: 4000 },
];

const EWALLET_METHODS = [
  { id: "qris", name: "QRIS", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_QRIS.svg/200px-Logo_QRIS.svg.png", fee: 0 },
  { id: "dana", name: "DANA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Dana_logo.svg/200px-Dana_logo.svg.png", fee: 0 },
  { id: "gopay", name: "GoPay", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Gopay_logo.svg/200px-Gopay_logo.svg.png", fee: 0 },
  { id: "ovo", name: "OVO", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Logo_ovo_purple.svg/200px-Logo_ovo_purple.svg.png", fee: 0 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, addToCart, decreaseQuantity, removeFromCart, totalCartPrice } = useStore();
  const { isLoggedIn, supabaseUser, isLoading } = useAuth();

  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [useSaldo, setUseSaldo] = useState(false);
  const [userSaldo, setUserSaldo] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<{bank_name: string; account_number: string; account_holder: string}[]>([]);

  // Guard: redirect ke halaman utama jika belum login
  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  React.useEffect(() => {
    if (supabaseUser) {
      supabase
        .from("profiles")
        .select("balance")
        .eq("id", supabaseUser.id)
        .single()
        .then(({ data }) => {
          if (data && data.balance) setUserSaldo(data.balance);
        });
    }
    // Fetch payment accounts from admin settings
    supabase
      .from("payment_accounts")
      .select("bank_name, account_number, account_holder")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setPaymentAccounts(data);
      });
  }, [supabaseUser]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price).replace(/\s/g, "");

  // Find the selected payment method's fee
  const allMethods = [...BANK_TRANSFER_METHODS, ...EWALLET_METHODS];
  const selectedMethod = allMethods.find((m) => m.id === selectedPayment);
  
  const isFullyCovered = useSaldo && userSaldo >= totalCartPrice;
  const serviceFee = isFullyCovered ? 0 : (selectedMethod?.fee ?? 0);
  const totalWithFee = totalCartPrice + serviceFee;
  const saldoDiscount = useSaldo ? Math.min(userSaldo, totalWithFee) : 0;
  const grandTotal = totalWithFee - saldoDiscount;

  const handleProceed = async () => {
    if (!isLoggedIn || !supabaseUser) {
      alert("Silakan login terlebih dahulu untuk melanjutkan pembayaran.");
      return;
    }
    if (!isFullyCovered && !selectedPayment) {
      alert("Silakan pilih metode pembayaran terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: txData, error } = await supabase.from("transactions").insert({
        user_id: supabaseUser.id,
        type: "order",
        amount: totalWithFee,
        status: isFullyCovered ? "approved" : "pending",
        payment_method: isFullyCovered ? "Saldo" : (selectedMethod?.name || selectedPayment),
        details: {
          items: cart,
          service_fee: serviceFee,
          saldo_used: saldoDiscount,
          buyer_email: supabaseUser.email,
          buyer_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "User"
        }
      }).select();

      if (error) throw error;

      // Update product stock and sold count for all checkout items
      for (const item of cart as any[]) {
        const prodId = item.product?.id || item.id;
        const quantity = item.quantity || 1;
        if (prodId) {
          const { data: currentProduct } = await supabase
            .from("products")
            .select("stock, sold")
            .eq("id", prodId)
            .single();
            
          if (currentProduct) {
            await supabase
              .from("products")
              .update({
                stock: Math.max(0, (currentProduct.stock || 0) - quantity),
                sold: (currentProduct.sold || 0) + quantity
              })
              .eq("id", prodId);
          }
        }
      }

      if (isFullyCovered) {
        // Deduct buyer's saldo
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", supabaseUser.id)
          .single();
        const currentBalance = userProfile?.balance || 0;
        await supabase
          .from("profiles")
          .update({ balance: currentBalance - saldoDiscount })
          .eq("id", supabaseUser.id);

        // Payout to sellers
        for (const item of cart as any[]) {
          const prodId = item.product?.id || item.id;
          if (prodId) {
            const { data: product } = await supabase
              .from("products")
              .select("store_id")
              .eq("id", prodId)
              .single();

            if (product && product.store_id) {
              const itemPrice = item.variation 
                ? (item.variation.discount_price ?? item.variation.price)
                : (item.product?.price ?? item.price ?? 0);
              const quantity = item.quantity || 1;
              const totalEarning = Number(itemPrice) * quantity;

              const { data: store } = await supabase
                .from("stores")
                .select("balance")
                .eq("id", product.store_id)
                .single();

              if (store) {
                const currentStoreBalance = Number(store.balance || 0);
                await supabase
                  .from("stores")
                  .update({ balance: currentStoreBalance + totalEarning })
                  .eq("id", product.store_id);
              }
            }
          }
        }
      }

      // Redirect to payment detail page
      const txId = txData?.[0]?.id || "";
      router.push(`/payment/${txId}`);
    } catch (err: any) {
      alert("Gagal memproses pesanan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <Header />
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <ShoppingCart size={48} className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>Keranjang Kosong</h2>
            <p className={styles.emptyText}>
              Belum ada produk di keranjang. Yuk cari produk yang kamu butuhkan!
            </p>
            <Link href="/" className={styles.backBtn}>
              <ArrowLeft size={16} /> Kembali ke Beranda
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.checkoutPage}>
      <Header />
      <div className={styles.container}>
        <div style={{ backgroundColor: "#FEF2F2", color: "#991B1B", padding: "16px", borderRadius: "8px", marginBottom: "24px", border: "1px solid #F87171" }}>
          <strong>⚠️ Peringatan:</strong> API Gateway sedang dalam masa maintenance. Untuk sementara, semua transaksi akan diproses secara manual oleh Admin Utama.
        </div>

        <h1 className={styles.pageTitle}>Checkout</h1>

        {/* ── Your Order ────────────────────────────────────────── */}
        <div className={styles.orderCard}>
          <div className={styles.orderHeader}>
            <span className={styles.orderTitle}>Your order</span>
            <span className={styles.orderCount}>({cart.length})</span>
          </div>

          {cart.map((item) => {
            const itemPrice = item.variation
              ? (item.variation.discount_price ?? item.variation.price)
              : item.product.price;
            const itemOriginal = item.variation
              ? (item.variation.discount_price ? item.variation.price : undefined)
              : item.product.originalPrice;

            return (
              <div
                key={`${item.product.id}-${item.variation?.id || "main"}`}
                className={styles.orderItem}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className={styles.itemImage}
                />

                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>{item.product.name}</div>
                  {item.variation && (
                    <div className={styles.itemVariation}>
                      Variant: {item.variation.name}
                    </div>
                  )}
                  <div className={styles.itemSeller}>
                    By : {item.product.seller.name}
                  </div>
                  <div className={styles.itemPriceRow}>
                    <span className={styles.itemPrice}>
                      {formatPrice(itemPrice)}
                    </span>
                    {itemOriginal && itemOriginal > itemPrice && (
                      <span className={styles.itemOriginalPrice}>
                        {formatPrice(itemOriginal)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity controls */}
                <div className={styles.quantityControls}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() =>
                      decreaseQuantity(item.product.id, item.variation?.id)
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <span className={styles.qtyValue}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() =>
                      addToCart(item.product, item.variation)
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Remove button */}
                <button
                  className={styles.removeItemBtn}
                  disabled
                  title="Item tidak dapat dihapus di halaman Checkout"
                  style={{ cursor: "not-allowed", opacity: 0.5 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Summary ───────────────────────────────────────────── */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            <span className={styles.summaryValue}>
              {formatPrice(totalCartPrice)}
            </span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              Biaya layanan{" "}
              {!selectedPayment && !isFullyCovered && (
                <span className={styles.summaryHint}>
                  (Pilih metode pembayaran dulu)
                </span>
              )}
            </span>
            <span className={styles.summaryValue}>
              {formatPrice(serviceFee)}
            </span>
          </div>

          {useSaldo && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel} style={{ color: 'var(--primary)', fontWeight: '600' }}>Saldo Dipakai</span>
              <span className={styles.summaryValue} style={{ color: 'var(--primary)', fontWeight: '600' }}>
                -{formatPrice(saldoDiscount)}
              </span>
            </div>
          )}

          <hr className={styles.summaryDivider} />

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>
              {formatPrice(grandTotal)}
            </span>
          </div>
        </div>

        {/* ── Saldo ─────────────────────────────────────────────── */}
        <div className={styles.saldoCard}>
          <div className={styles.saldoHeader}>
            <span className={styles.saldoTitle}>Saldo Anda</span>
            <span className={styles.saldoAmount}>{formatPrice(userSaldo)}</span>
          </div>
          <label className={styles.saldoCheckboxRow}>
            <input
              type="checkbox"
              className={styles.saldoCheckbox}
              checked={useSaldo}
              onChange={(e) => setUseSaldo(e.target.checked)}
              disabled={userSaldo <= 0}
            />
            <span className={styles.saldoCheckboxLabel}>Gunakan Saldo</span>
          </label>
        </div>

        {/* ── Payment Methods ───────────────────────────────────── */}
        {!isFullyCovered && (
          <div className={styles.paymentCard}>
            <div className={styles.paymentTitle}>Pilih metode pembayaran</div>

          {/* Bank Transfer */}
          <div className={styles.paymentGroupTitle}>Bank Transfer</div>
          <div className={styles.paymentGrid}>
            {BANK_TRANSFER_METHODS.map((method) => (
              <button
                key={method.id}
                className={`${styles.paymentOption} ${
                  selectedPayment === method.id
                    ? styles.paymentOptionActive
                    : ""
                }`}
                onClick={() => setSelectedPayment(method.id)}
                title={method.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={method.logo}
                  alt={method.name}
                  className={styles.paymentLogo}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="${styles.paymentName}">${method.name}</span>`;
                  }}
                />
              </button>
            ))}
          </div>

          {/* E-Wallet */}
          <div className={styles.paymentGroupTitle}>E-Wallet / QRIS</div>
          <div className={styles.paymentGrid}>
            {EWALLET_METHODS.map((method) => (
              <button
                key={method.id}
                className={`${styles.paymentOption} ${
                  selectedPayment === method.id
                    ? styles.paymentOptionActive
                    : ""
                }`}
                onClick={() => setSelectedPayment(method.id)}
                title={method.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={method.logo}
                  alt={method.name}
                  className={styles.paymentLogo}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="${styles.paymentName}">${method.name}</span>`;
                  }}
                />
              </button>
            ))}
          </div>

          {/* ── Account Info Box (muncul setelah pilih metode) ── */}
          {selectedPayment && (() => {
            const selectedMethodName = [...BANK_TRANSFER_METHODS, ...EWALLET_METHODS].find(m => m.id === selectedPayment)?.name;
            const accountInfo = paymentAccounts.find(acc => acc.bank_name.toLowerCase() === selectedMethodName?.toLowerCase());
            return accountInfo ? (
              <div style={{ marginTop: 16, padding: 16, background: "rgba(16, 185, 129, 0.06)", border: "1.5px solid var(--primary)", borderRadius: 10 }}>
                <p style={{ fontSize: 13, fontWeight: "600", color: "var(--text-muted)", marginBottom: 10 }}>📋 Transfer ke rekening berikut:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Bank / Metode</span>
                    <span style={{ fontWeight: "700", fontSize: 15, color: "var(--text-main)" }}>{accountInfo.bank_name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Nomor Rekening</span>
                    <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: 17, color: "var(--primary)", letterSpacing: "0.05em" }}>{accountInfo.account_number}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Atas Nama</span>
                    <span style={{ fontWeight: "600", fontSize: 14, color: "var(--text-main)" }}>{accountInfo.account_holder}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 16, padding: 14, background: "var(--bg-input)", borderRadius: 10, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                ℹ️ Nomor rekening belum diisi oleh Admin. Silakan hubungi kami.
              </div>
            );
          })()}
        </div>
        )}

        {/* ── Proceed Button ────────────────────────────────────── */}
        <button
          className={styles.proceedBtn}
          onClick={handleProceed}
          disabled={cart.length === 0 || isSubmitting}
        >
          {isSubmitting ? "Memproses..." : "Proceed Payment"}
        </button>
      </div>
      <Footer />
    </div>
  );
}
