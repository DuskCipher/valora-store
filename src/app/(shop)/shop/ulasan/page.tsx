"use client";

import React, { useState, useEffect } from "react";
import { Search, Star, MessageSquare, Calendar } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

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
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Ulasan Toko Saya <span className={styles.count}>({reviews.length})</span></h1>
        <p className={styles.subtitle}>Lihat penilaian dan ulasan yang diberikan pembeli untuk produk Anda</p>
      </header>

      {/* Filter rating */}
      <div className={styles.tabsContainer}>
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
            className={`${styles.tabBtn} ${ratingFilter === tab.key ? styles.tabBtnActive : styles.tabBtnInactive}`}
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

      <div className={styles.reviewList}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Memuat data ulasan...</div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Tidak ada ulasan ditemukan.</div>
        ) : (
          filteredReviews.map((r, index) => (
            <div key={r.id || index} className={styles.reviewCard}>
              <div className={styles.reviewMain}>
                <img
                  src={r.buyer_avatar || `https://ui-avatars.com/api/?name=${r.buyer_name}&background=random`}
                  alt={r.buyer_name}
                  className={styles.avatar}
                />
                
                <div className={styles.reviewContent}>
                  <div className={styles.reviewerHeader}>
                    <h3 className={styles.reviewerName}>{r.buyer_name}</h3>
                    <span className={styles.reviewDate}>
                      <Calendar size={12} /> {new Date(r.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, starIdx) => (
                      <Star
                        key={starIdx}
                        size={14}
                        fill={starIdx < r.rating ? "var(--primary)" : "none"}
                        color={starIdx < r.rating ? "var(--primary)" : "var(--text-muted)"}
                      />
                    ))}
                  </div>

                  <p className={styles.comment}>
                    {r.comment || <em style={{ color: "var(--text-muted)" }}>Tidak ada ulasan teks.</em>}
                  </p>
                </div>
              </div>

              <div className={styles.productSection}>
                <span className={styles.productLabel}>Produk diulas</span>
                <span className={styles.productName}>{r.product_name}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
