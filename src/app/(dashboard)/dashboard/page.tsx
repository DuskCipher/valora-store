"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DollarSign, Receipt, ShoppingBag, Archive, Plus, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { supabaseUser } = useAuth();
  
  const [data, setData] = useState({
    balance: 0,
    topupTotalCount: 0,
    topupTotalAmount: 0,
    topupPendingCount: 0,
    topupPendingAmount: 0,
    orderTotalCount: 0,
    orderPendingCount: 0,
    withdrawTotalCount: 0,
    withdrawTotalAmount: 0,
    successTotalCount: 0,
    rejectedTotalCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (supabaseUser) {
      fetchDashboardData();
    }
  }, [supabaseUser]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    
    // Fetch balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", supabaseUser?.id)
      .single();
      
    // Fetch transactions
    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", supabaseUser?.id);
      
    let stats = {
      balance: profile?.balance || 0,
      topupTotalCount: 0, topupTotalAmount: 0, topupPendingCount: 0, topupPendingAmount: 0,
      orderTotalCount: 0, orderPendingCount: 0,
      withdrawTotalCount: 0, withdrawTotalAmount: 0,
      successTotalCount: 0, rejectedTotalCount: 0,
    };

    if (txs) {
      txs.forEach(t => {
        if (t.type === 'topup' || t.type === 'order') {
          if (t.status === 'approved' || t.status === 'success') {
            stats.successTotalCount++;
          }
          if (t.status === 'rejected' || t.status === 'cancelled') {
            stats.rejectedTotalCount++;
          }
        }

        // Total Semua Invoice (Payment History) includes both topups and orders
        if (t.type === 'topup' || t.type === 'order') {
          stats.topupTotalCount++;
          stats.topupTotalAmount += t.amount;
          
          if (t.status === 'pending') {
            stats.topupPendingCount++;
            stats.topupPendingAmount += t.amount;
          }
        }
        
        // Total Transaksi includes both orders and topups to match
        if (t.type === 'order' || t.type === 'topup') {
          stats.orderTotalCount++;
          
          if (t.status === 'pending') {
            stats.orderPendingCount++;
          }
        } else if (t.type === 'withdraw') {
          if (t.status !== 'rejected') {
            stats.withdrawTotalCount++;
            stats.withdrawTotalAmount += t.amount;
          }
        }
      });
    }
    
    setData(stats);
    setIsLoading(false);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price).replace(/\s/g, "");

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          Memuat dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Selamat datang di dashboard Anda</p>
      </header>

      <div className={styles.grid}>
        {/* Card 1: Saldo */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardValue}>{formatPrice(data.balance)}</h2>
              <p className={styles.cardLabel}>Saldo Anda</p>
            </div>
            <div className={styles.cardIconBox}>
              <DollarSign size={20} className={styles.cardIcon} />
            </div>
          </div>
          <div className={styles.cardActions}>
            <button className={`${styles.actionBtn} ${styles.btnGreen}`} onClick={() => router.push("/topup")}>
              <Plus size={16} /> Deposit
            </button>
            <button className={`${styles.actionBtn} ${styles.btnDark}`} onClick={() => router.push("/penarikan")}>
              <Archive size={16} style={{ transform: 'rotate(180deg)' }} /> Penarikan
            </button>
          </div>
        </div>

        {/* Card 2: Invoices */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardValue}>{data.topupTotalCount}</h2>
              <p className={styles.cardLabel}>Total Semua Invoice ({formatPrice(data.topupTotalAmount)})</p>
              {data.topupPendingCount > 0 && (
                <p className={styles.cardAlert} style={{ color: "var(--danger)" }}>
                  {data.topupPendingCount} Waiting for payment ({formatPrice(data.topupPendingAmount)})
                </p>
              )}
            </div>
            <div className={styles.cardIconBox}>
              <Receipt size={20} className={styles.cardIcon} />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <Link href="/payment-history" className={styles.detailBtn}>Detail</Link>
          </div>
        </div>

        {/* Card 3: Transaksi */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardValue}>{data.orderTotalCount}</h2>
              <p className={styles.cardLabel}>Total transaksi anda</p>
              {data.orderPendingCount > 0 && (
                <p className={styles.cardAlert} style={{ color: "var(--danger)" }}>
                  {data.orderPendingCount} Transactions are being processed
                </p>
              )}
            </div>
            <div className={styles.cardIconBox}>
              <ShoppingBag size={20} className={styles.cardIcon} />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <Link href="/pembelian" className={styles.detailBtn}>Detail</Link>
          </div>
        </div>

        {/* Card 4: Penarikan */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardValue}>{data.withdrawTotalCount}</h2>
              <p className={styles.cardLabel}>Total penarikan anda {formatPrice(data.withdrawTotalAmount)}</p>
            </div>
            <div className={styles.cardIconBox}>
              <Archive size={20} className={styles.cardIcon} />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <Link href="/penarikan" className={styles.detailBtn}>Detail</Link>
          </div>
        </div>

        {/* Card 5: Transaksi Berhasil */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardValue}>{data.successTotalCount}</h2>
              <p className={styles.cardLabel}>Total transaksi berhasil</p>
            </div>
            <div className={styles.cardIconBox}>
              <CheckCircle size={20} className={styles.cardIcon} />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <Link href="/pembelian" className={styles.detailBtn}>Detail</Link>
          </div>
        </div>

        {/* Card 6: Transaksi Ditolak */}
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.cardInfo}>
              <h2 className={styles.cardValue}>{data.rejectedTotalCount}</h2>
              <p className={styles.cardLabel}>Transaksi ditolak</p>
            </div>
            <div className={styles.cardIconBox}>
              <XCircle size={20} className={styles.cardIcon} />
            </div>
          </div>
          <div className={styles.cardFooter}>
            <Link href="/payment-history" className={styles.detailBtn}>Detail</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
