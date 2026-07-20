"use client";

import React, { useState, useEffect } from "react";
import { Search, Star, MessageSquare, Calendar } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "../../../(dashboard)/payment-history/page.module.css";

interface ReviewItem {
  id: string;
  created_at: string;
  rating: number;
  comment: string;
  product_name: string;
  buyer_name: string;
  buyer_avatar: string;
}

export default function ShopUlasanPage() {
  const { supabaseUser } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  useEffect(() => {
    if (supabaseUser) {
      fetchReviews();
    }
  }, [supabaseUser]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      // 1. Get the store ID
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

      // 3. Fetch all reviews for these products from transactions
      const { data: fetchedReviews, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "review")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (fetchedReviews) {
        // Filter transactions to only include those for my products
        const myStoreReviews = fetchedReviews.filter(r => myProductIds.includes(r.details?.product_id));

        const mappedReviews: ReviewItem[] = myStoreReviews.map(r => ({
          id: r.id,
          created_at: r.created_at,
          rating: r.details?.rating || 5,
          comment: r.details?.comment || "",
          product_name: myProductNamesMap.get(r.details?.product_id) || "Produk",
          buyer_name: r.details?.reviewer_name || "Pembeli",
          buyer_avatar: r.details?.reviewer_avatar || ""
        }));
        setReviews(mappedReviews);
      }
    } catch (err) {
      console.error("Error fetching shop reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.buyer_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (ratingFilter === "all") return matchesSearch;
    return matchesSearch && r.rating === Number(ratingFilter);
  });

  return (
    <div className={styles.container} style={{ minHeight: "auto", padding: "24px" }}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ulasan Toko Saya <span className={styles.count}>({reviews.length})</span></h1>
        <p className={styles.subtitle}>Lihat penilaian dan ulasan yang diberikan pembeli untuk produk Anda</p>
      </header>

      {/* Filter rating */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
        {[
          { key: "all", label: "Semua Rating" },
          { key: 5, label: "⭐⭐⭐⭐⭐ (5)" },
          { key: 4, label: "⭐⭐⭐⭐ (4)" },
          { key: 3, label: "⭐⭐⭐ (3)" },
          { key: 2, label: "⭐⭐ (2)" },
          { key: 1, label: "⭐ (1)" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRatingFilter(tab.key as any)}
            style={{
              padding: "8px 16px",
              background: ratingFilter === tab.key ? "var(--primary)" : "none",
              color: ratingFilter === tab.key ? "white" : "var(--text-muted)",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "13px"
            }}
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
            placeholder="Cari kata kunci, nama pembeli, nama produk..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Memuat data ulasan...</div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Tidak ada ulasan ditemukan.</div>
        ) : (
          filteredReviews.map((r, index) => (
            <div key={r.id || index} style={{ display: "flex", gap: "20px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "20px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "16px", flex: "1 1 300px" }}>
                <img
                  src={r.buyer_avatar || `https://ui-avatars.com/api/?name=${r.buyer_name}&background=random`}
                  alt={r.buyer_name}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                />
                
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>{r.buyer_name}</h3>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} /> {new Date(r.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", gap: "2px" }}>
                    {[...Array(5)].map((_, starIdx) => (
                      <Star
                        key={starIdx}
                        size={14}
                        fill={starIdx < r.rating ? "var(--primary)" : "none"}
                        color={starIdx < r.rating ? "var(--primary)" : "var(--text-muted)"}
                      />
                    ))}
                  </div>

                  <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "8px 0 0 0", lineHeight: "1.5" }}>
                    {r.comment || <em style={{ color: "var(--text-muted)" }}>Tidak ada ulasan teks.</em>}
                  </p>
                </div>
              </div>

              <div style={{ flexShrink: 0, paddingLeft: "20px", borderLeft: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: "150px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Produk diulas</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)", marginTop: "4px" }}>{r.product_name}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
