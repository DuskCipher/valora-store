"use client";

import React, { useState, useEffect } from "react";
import {
  Banknote,
  ClipboardList,
  ShoppingCart,
  ShoppingBasket,
  Clock,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileSearch,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

interface RecentOrder {
  id: string;
  created_at: string;
  product_name: string;
  buyer_name: string;
  total: number;
  status: string;
}

export default function ShopDashboardPage() {
  const { supabaseUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // States for stats
  const [stats, setStats] = useState({
    earnings: 0,
    earningsCount: 0,
    upcomingEarnings: 0,
    upcomingCount: 0,
    totalOrders: 0,
    totalOrdersValue: 0,
    totalProducts: 0,
    pendingProducts: 0,
    statusPending: 0,
    statusProcessing: 0,
    statusCompleted: 0,
    statusDispute: 0,
    statusCancelled: 0,
    totalWithdrawn: 0,
    totalWithdrawnCount: 0,
  });

  const [monthlyEarnings, setMonthlyEarnings] = useState<number[]>(Array(12).fill(0));
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    if (supabaseUser) {
      fetchDashboardData();
    }
  }, [supabaseUser]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Get the seller's store ID
      const { data: store } = await supabase
        .from("stores")
        .select("id, balance")
        .eq("owner_id", supabaseUser?.id)
        .single();

      if (!store) {
        setIsLoading(false);
        return;
      }

      // 2. Get store's products details
      const { data: products } = await supabase
        .from("products")
        .select("id, name, is_active")
        .eq("store_id", store.id);

      const totalProd = products?.length || 0;
      const pendingProd = products?.filter(p => !p.is_active).length || 0;

      // Map product names
      const myProductIds = products?.map(p => p.id) || [];
      const myProductNamesMap = new Map(products?.map(p => [p.id, p.name]) || []);

      // 3. Fetch all order transactions
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "order")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles to map buyer names
      const buyerIds = [...new Set(txs?.map(t => t.user_id) || [])];
      let profilesMap: Record<string, any> = {};
      
      if (buyerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", buyerIds);
          
        if (profilesData) {
          profilesData.forEach(p => {
            profilesMap[p.id] = p;
          });
        }
      }

      // Temp accumulators
      let earnings = 0;
      let earningsCount = 0;
      let upcomingEarnings = 0;
      let upcomingCount = 0;
      let totalOrders = 0;
      let totalOrdersValue = 0;

      let statusPending = 0;
      let statusProcessing = 0;
      let statusCompleted = 0;
      let statusCancelled = 0;

      const monthlyData = Array(12).fill(0);
      const ordersList: RecentOrder[] = [];

      if (txs && myProductIds.length > 0) {
        txs.forEach(t => {
          const items = t.details?.items || [];
          let containsMyProduct = false;
          let myOrderValue = 0;

          items.forEach((item: any) => {
            const prodId = item.product?.id || item.id;
            if (myProductIds.includes(prodId)) {
              containsMyProduct = true;
              const itemPrice = item.variation 
                ? (item.variation.discount_price ?? item.variation.price)
                : (item.product?.price ?? item.price ?? 0);
              
              const itemTotal = Number(itemPrice) * (item.quantity || 1);
              myOrderValue += itemTotal;

              // Insert to recent orders (up to 5)
              if (ordersList.length < 5) {
                const buyer = profilesMap[t.user_id] || { full_name: "Pembeli" };
                ordersList.push({
                  id: t.id,
                  created_at: t.created_at,
                  product_name: myProductNamesMap.get(prodId) || item.product?.name || "Produk",
                  buyer_name: buyer.full_name,
                  total: itemTotal,
                  status: t.status
                });
              }
            }
          });

          if (containsMyProduct) {
            totalOrders++;
            totalOrdersValue += myOrderValue;

            const orderDate = new Date(t.created_at);
            const currentYear = new Date().getFullYear();

            if (t.status === "approved") {
              earnings += myOrderValue;
              earningsCount++;
              statusCompleted++;

              // Fill chart monthly earnings for current year
              if (orderDate.getFullYear() === currentYear) {
                const month = orderDate.getMonth();
                monthlyData[month] += myOrderValue;
              }
            } else if (t.status === "pending") {
              upcomingEarnings += myOrderValue;
              upcomingCount++;
              statusPending++;
            } else if (t.status === "rejected") {
              statusCancelled++;
            }
          }
        });
      }

      let totalWithdrawnAndPending = 0;
      let actualWithdrawn = 0;
      let withdrawnCount = 0;

      // Auto-sync store balance in case admin approval failed to update it due to RLS
      try {
        const { data: withdrawTxs } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", supabaseUser?.id)
          .eq("type", "withdraw");
          
        if (withdrawTxs) {
          withdrawTxs.forEach(w => {
            if (w.details?.is_store_withdrawal && (w.status === "approved" || w.status === "pending")) {
              totalWithdrawnAndPending += w.amount;
              if (w.status === "approved") {
                actualWithdrawn += w.details.receive_amount || w.amount;
                withdrawnCount++;
              }
            }
          });
        }

        const expectedBalance = earnings - totalWithdrawnAndPending;
        // Only update if mismatch and expected >= 0
        if (store.balance !== expectedBalance && expectedBalance >= 0) {
          await supabase
            .from("stores")
            .update({ balance: expectedBalance })
            .eq("id", store.id);
        }
      } catch (syncErr) {
        console.error("Auto-sync balance failed", syncErr);
      }

      setStats({
        earnings,
        earningsCount,
        upcomingEarnings,
        upcomingCount,
        totalOrders,
        totalOrdersValue,
        totalProducts: totalProd,
        pendingProducts: pendingProd,
        statusPending,
        statusProcessing, // can show as 0 if unused
        statusCompleted,
        statusDispute: 0,
        statusCancelled,
        totalWithdrawn: actualWithdrawn,
        totalWithdrawnCount: withdrawnCount,
      });

      setMonthlyEarnings(monthlyData);
      setRecentOrders(ordersList);
    } catch (err) {
      console.error("Error loading shop stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price).replace(/\s/g, "");

  const maxEarning = Math.max(...monthlyEarnings, 100000); // base for chart height scale

  return (
    <div className={styles.container}>
      {/* Ringkasan Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIndicator}></div>
            <h2 className={styles.sectionTitle}>Ringkasan Toko</h2>
          </div>
        </div>

        <div className={styles.grid4}>
          <div className={`${styles.card} ${styles.borderGreen}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><Banknote size={24} color="#10b981" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Pendapatan Anda</p>
              <h3 className={styles.cardValue}>{formatPrice(stats.earnings)}</h3>
              <p className={styles.cardSubtext}>Dari {stats.earningsCount} Transaksi Selesai</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.borderPurple}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><ClipboardList size={24} color="#a855f7" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Pendapatan Mendatang</p>
              <h3 className={styles.cardValue}>{formatPrice(stats.upcomingEarnings)}</h3>
              <p className={styles.cardSubtext}>Dari {stats.upcomingCount} Transaksi Pending</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.borderBlue}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><ShoppingCart size={24} color="#6366f1" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Total Pesanan Toko</p>
              <h3 className={styles.cardValue}>{stats.totalOrders}</h3>
              <p className={styles.cardSubtext}>Total Nilai: {formatPrice(stats.totalOrdersValue)}</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.borderPink}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><ShoppingBasket size={24} color="#ec4899" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Total Produk Anda</p>
              <h3 className={styles.cardValue}>{stats.totalProducts}</h3>
              <p className={styles.cardSubtext}>{stats.pendingProducts} Produk Tidak Aktif</p>
            </div>
          </div>

          <div className={`${styles.card} ${styles.borderGreen}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><Banknote size={24} color="#10b981" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Hasil Penarikan</p>
              <h3 className={styles.cardValue}>{formatPrice(stats.totalWithdrawn)}</h3>
              <p className={styles.cardSubtext}>Dari {stats.totalWithdrawnCount} Penarikan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Order Status Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIndicator}></div>
            <h2 className={styles.sectionTitle}>Status Pesanan</h2>
          </div>
        </div>

        <div className={styles.grid5}>
          <div className={`${styles.card} ${styles.borderYellow}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><Clock size={24} color="#eab308" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Total Pending</p>
              <h3 className={styles.cardValue}>{stats.statusPending}</h3>
            </div>
          </div>

          <div className={`${styles.card} ${styles.borderBlue}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><Settings size={24} color="#6366f1" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Total Diproses</p>
              <h3 className={styles.cardValue}>{stats.statusProcessing}</h3>
            </div>
          </div>

          <div className={`${styles.card} ${styles.borderGreen}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><CheckCircle size={24} color="#10b981" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Total Selesai</p>
              <h3 className={styles.cardValue}>{stats.statusCompleted}</h3>
            </div>
          </div>

          <div className={`${styles.card} ${styles.borderOrange}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><AlertCircle size={24} color="#f59e0b" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Dispute</p>
              <h3 className={styles.cardValue}>{stats.statusDispute}</h3>
            </div>
          </div>

          <div className={`${styles.card} ${styles.borderPink}`}>
            <div className={styles.cardIconWrapper}>
              <div className={styles.iconBg}><XCircle size={24} color="#ec4899" /></div>
            </div>
            <div className={styles.cardContent}>
              <p className={styles.cardLabel}>Dibatalkan</p>
              <h3 className={styles.cardValue}>{stats.statusCancelled}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Grafik Pesanan Selesai */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIndicator}></div>
            <h2 className={styles.sectionTitle}>Grafik Penjualan Tahun Ini ({new Date().getFullYear()})</h2>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.chartYAxis}>
            <span>{formatPrice(maxEarning)}</span>
            <span>{formatPrice(maxEarning * 0.8)}</span>
            <span>{formatPrice(maxEarning * 0.6)}</span>
            <span>{formatPrice(maxEarning * 0.4)}</span>
            <span>{formatPrice(maxEarning * 0.2)}</span>
            <span>Rp0</span>
          </div>
          <div className={styles.chartGrid}>
            {/* Visual Bars Overlay */}
            <div style={{ position: "absolute", top: 0, bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 10px", zIndex: 2 }}>
              {monthlyEarnings.map((earn, idx) => {
                const percent = (earn / maxEarning) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    {earn > 0 && (
                      <span style={{ fontSize: "10px", fontWeight: "bold", color: "var(--primary)" }}>
                        {formatPrice(earn)}
                      </span>
                    )}
                    <div 
                      style={{ 
                        width: "60%", 
                        height: `${percent}%`, 
                        minHeight: earn > 0 ? "4px" : "0px",
                        backgroundColor: "#10b981", 
                        borderRadius: "4px 4px 0 0",
                        transition: "height 0.5s ease" 
                      }}
                      title={formatPrice(earn)}
                    />
                  </div>
                );
              })}
            </div>

            <div className={styles.gridLine}></div>
            <div className={styles.gridLine}></div>
            <div className={styles.gridLine}></div>
            <div className={styles.gridLine}></div>
            <div className={styles.gridLine}></div>
            <div className={styles.gridLine}></div>
            
            <div className={styles.chartXAxis}>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>Mei</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Agu</span>
              <span>Sep</span>
              <span>Okt</span>
              <span>Nov</span>
              <span>Des</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pesanan Terbaru */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIndicator}></div>
            <h2 className={styles.sectionTitle}>Pesanan Terbaru</h2>
          </div>
        </div>

        {recentOrders.length > 0 ? (
          <div style={{ background: "var(--bg-card)", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-color)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-main)" }}>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>Tanggal</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>Produk</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>Pembeli</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>Total</th>
                  <th style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 13 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, idx) => (
                  <tr key={`${o.id}-${idx}`} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "14px 16px", fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: "600" }}>{o.product_name}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13 }}>{o.buyer_name}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: "600", color: "var(--primary)" }}>{formatPrice(o.total)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: "bold",
                        backgroundColor: o.status === "approved" ? "#d1fae5" : o.status === "rejected" ? "#fee2e2" : "#fef3c7",
                        color: o.status === "approved" ? "#065f46" : o.status === "rejected" ? "#991b1b" : "#b45309",
                      }}>
                        {o.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <FileSearch size={64} color="#cbd5e1" strokeWidth={1} />
            </div>
            <h3 className={styles.emptyStateTitle}>Anda tidak memiliki Pesanan</h3>
            <p className={styles.emptyStateDesc}>Belum ada transaksi pembelian produk toko Anda.</p>
          </div>
        )}
      </section>

      {/* Footer copyright */}
      <div className={styles.dashboardFooter} style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--text-muted)", marginTop: "30px", paddingBottom: "20px" }}>
        <span>© Copyright 2026 PT VALORA NUSANTARA TECHWORK 2.1.</span>
        <span>Dengan menggunakan layanan kami, Anda menyetujui Syarat Layanan dan Kebijakan Privasi.</span>
      </div>
    </div>
  );
}
