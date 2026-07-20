"use client";

import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

interface OrderItem {
  id: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  payment_method: string;
  status: string;
}

export default function ShopPenjualanPage() {
  const { supabaseUser } = useAuth();
  const [sales, setSales] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");

  useEffect(() => {
    if (supabaseUser) {
      fetchSales();
    }
  }, [supabaseUser]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      // 1. Get the seller's store ID
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", supabaseUser?.id)
        .single();

      if (!store) {
        setIsLoading(false);
        return;
      }

      // 2. Get all products belonging to this store
      const { data: myProducts } = await supabase
        .from("products")
        .select("id, name")
        .eq("store_id", store.id);

      if (!myProducts || myProducts.length === 0) {
        setIsLoading(false);
        return;
      }

      const myProductIds = myProducts.map(p => p.id);
      const myProductNamesMap = new Map(myProducts.map(p => [p.id, p.name]));

      // 3. Fetch all order transactions
      const { data: txs, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "order")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (txs) {
        // Fetch profiles of buyers
        const buyerIds = [...new Set(txs.map(t => t.user_id))];
        let profilesMap: Record<string, any> = {};
        
        if (buyerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", buyerIds);
            
          if (profilesData) {
            profilesData.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        // Filter and map transactions containing the seller's products
        const mappedSales: OrderItem[] = [];

        txs.forEach(t => {
          const items = t.details?.items || [];
          const profileBuyer = profilesMap[t.user_id] || { full_name: "Pembeli" };
          
          const buyer_name = t.details?.buyer_name || profileBuyer.full_name || "Pembeli";
          const buyer_email = t.details?.buyer_email || "";

          items.forEach((item: any) => {
            const prodId = item.product?.id || item.id; // handle varying item schemas
            if (myProductIds.includes(prodId)) {
              const itemPrice = item.variation 
                ? (item.variation.discount_price ?? item.variation.price)
                : (item.product?.price ?? item.price);
              
              mappedSales.push({
                id: t.id,
                created_at: t.created_at,
                buyer_name: buyer_name,
                buyer_email: buyer_email,
                product_name: myProductNamesMap.get(prodId) || item.product?.name || "Produk",
                quantity: item.quantity || 1,
                price: Number(itemPrice),
                total: Number(itemPrice) * (item.quantity || 1),
                payment_method: t.payment_method,
                status: t.status
              });
            }
          });
        });

        setSales(mappedSales);
      }
    } catch (err) {
      console.error("Error fetching sales:", err);
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved": return { label: "Disetujui", color: "#065f46", bg: "#d1fae5", icon: <CheckCircle size={14} /> };
      case "rejected": return { label: "Ditolak / Batal", color: "#991b1b", bg: "#fee2e2", icon: <XCircle size={14} /> };
      default: return { label: "Menunggu", color: "#92400e", bg: "#fef3c7", icon: <Clock size={14} /> };
    }
  };

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeStatusFilter === "all") return matchesSearch;
    return matchesSearch && s.status === activeStatusFilter;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Penjualan Toko Saya <span className={styles.count}>({sales.length})</span></h1>
        <p className={styles.subtitle}>Kelola pesanan masuk dari pembeli produk Anda</p>
      </header>

      {/* Filter Tabs */}
      <div className={styles.tabsContainer}>
        {[
          { key: "all", label: "Semua" },
          { key: "pending", label: "Menunggu Pembayaran" },
          { key: "approved", label: "Disetujui / Lunas" },
          { key: "rejected", label: "Dibatalkan" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveStatusFilter(tab.key)}
            className={`${styles.tabBtn} ${activeStatusFilter === tab.key ? styles.tabBtnActive : styles.tabBtnInactive}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari nama produk, nama pembeli, ID pesanan..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.invoiceList}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Memuat data pesanan...</div>
        ) : filteredSales.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Tidak ada penjualan ditemukan.</div>
        ) : (
          filteredSales.map((s, index) => {
            const statusInfo = getStatusInfo(s.status);
            return (
              <div key={`${s.id}-${index}`} className={styles.invoiceItem}>
                <div className={styles.invoiceLeft}>
                  <div className={styles.iconWrapper}>
                    <ShoppingBag size={24} color="var(--primary)" />
                  </div>
                  
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{s.product_name}</h3>
                    <span className={styles.productMeta}>Qty: {s.quantity} | Harga: {formatPrice(s.price)}</span>
                    <span className={styles.buyerInfo}>
                      <User size={12} /> {s.buyer_name} ({s.buyer_email || "Email tidak tersedia"})
                    </span>
                  </div>
                </div>

                <div className={styles.invoiceRight}>
                  <div className={styles.revenueInfo}>
                    <span className={styles.revenueLabel}>Pendapatan</span>
                    <span className={styles.revenueAmount}>{formatPrice(s.total)}</span>
                    <span className={styles.paymentMethod}>Metode: {s.payment_method}</span>
                  </div>
                  
                  <div className={styles.statusWrapper}>
                    <span className={styles.statusBadge} style={{ background: statusInfo.bg, color: statusInfo.color }}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                    <span className={styles.orderId}>ID: #{s.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
