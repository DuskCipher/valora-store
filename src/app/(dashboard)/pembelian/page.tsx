"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronDown, ExternalLink, Star, X } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import styles from "../payment-history/page.module.css";
import Image from "next/image";

export default function PembelianPage() {
  const { supabaseUser } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [latestLinks, setLatestLinks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Review Modal States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supabaseUser) {
      fetchPurchases();
    }
  }, [supabaseUser]);

  const fetchPurchases = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", supabaseUser?.id)
      .eq("type", "order")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (data) {
      setPurchases(data);

      // Fetch latest product file_urls so previous buyers get the newest files
      const productIds: string[] = [];
      data.forEach((t: any) => {
        (t.details?.items || []).forEach((item: any) => {
           if (item.product?.id) productIds.push(item.product.id);
        });
      });
      if (productIds.length > 0) {
        const { data: latestProds } = await supabase
          .from("products")
          .select("id, file_url, allow_download_update")
          .in("id", productIds);
          
        const { data: latestVars } = await supabase
          .from("product_variations")
          .select("id, product_id, file_url")
          .in("product_id", productIds);
          
        if (latestProds) {
          const links: Record<string, string> = {};
          
          latestProds.forEach((p: any) => {
             // allow_download_update check can be added if needed, but assuming sellers want to give latest if they updated file_url
             if (p.file_url) links[p.id] = p.file_url;
          });

          if (latestVars) {
            latestVars.forEach((v: any) => {
               if (v.file_url) links[`${v.product_id}_${v.id}`] = v.file_url;
            });
          }
          setLatestLinks(links);
        }
      }
    }

    const { data: reviewsData } = await supabase
      .from("transactions")
      .select("id, details")
      .eq("user_id", supabaseUser?.id)
      .eq("type", "review");

    if (reviewsData) {
      setReviews(reviewsData);
    }
    
    setIsLoading(false);
  };

  const openReviewModal = (item: any) => {
    setReviewItem(item);
    setRating(5);
    setComment("");
    setIsReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!reviewItem || !supabaseUser) return;
    setIsSubmitting(true);
    
    // Fetch user's profile to get latest name and avatar
    const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", supabaseUser.id).single();
    
    const reviewerName = profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || "Pengguna";
    const reviewerAvatar = profile?.avatar_url || supabaseUser.user_metadata?.avatar_url || "";

    const productId = reviewItem.product?.id || reviewItem.id;
    const { error } = await supabase.from("transactions").insert({
      user_id: supabaseUser.id,
      type: "review",
      amount: 0,
      status: "approved", // auto approved
      details: {
        product_id: productId,
        transaction_id: reviewItem.transactionId,
        rating: rating,
        comment: comment,
        reviewer_name: reviewerName,
        reviewer_avatar: reviewerAvatar
      }
    });

    if (!error) {
      alert("Ulasan berhasil dikirim! Terima kasih.");
      setIsReviewModalOpen(false);
      fetchPurchases(); // refresh to update UI
    } else {
      alert("Gagal mengirim ulasan: " + error.message);
    }
    setIsSubmitting(false);
  };

  // Flatten the items from all approved transactions
  const purchasedItems = purchases.flatMap(t => {
    const items = t.details?.items || [];
    return items.map((item: any) => ({
      ...item,
      transactionId: t.id,
      date: t.created_at
    }));
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pembelian Saya</h1>
        <p className={styles.subtitle}>Semua produk yang sudah Anda beli dan disetujui (ACC)</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Cari Produk..." className={styles.searchInput} />
        </div>
        <button className={styles.filterBtn}>
          Filter <ChevronDown size={16} />
        </button>
      </div>

      <div style={{ marginTop: '24px' }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Memuat produk Anda...</div>
        ) : purchasedItems.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {purchasedItems.map((item, index) => (
              <div key={`${item.transactionId}-${index}`} className={styles.purchaseCard}>
                
                <div className={styles.purchaseCardLeft}>
                  <div style={{ width: "80px", height: "80px", flexShrink: 0, borderRadius: "10px", overflow: "hidden", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)" }}>
                    {item.product?.images?.[0] ? (
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px" }}>No Img</div>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>
                      {item.product?.name}
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                      Tanggal Beli: {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      Status: <span style={{ color: "#065f46", fontWeight: "600", padding: "2px 8px", backgroundColor: "#d1fae5", borderRadius: "12px", fontSize: "11px", marginLeft: "4px" }}>PAID & APPROVED</span>
                    </div>
                  </div>
                </div>

                <div className={styles.purchaseCardRight}>
                  <div className={styles.purchaseActions}>
                    <a 
                      href={latestLinks[`${item.product?.id}_${item.variation?.id}`] || latestLinks[item.product?.id] || item.product?.downloadUrl || item.product?.demoUrl || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.purchaseAccessBtn}
                    >
                      <ExternalLink size={16} /> Akses Produk
                    </a>

                    {(() => {
                      const productId = item.product?.id || item.id;
                      const hasReviewed = reviews.some(r => r.details?.transaction_id === item.transactionId && r.details?.product_id === productId);
                      
                      if (hasReviewed) {
                        return (
                          <div className={styles.purchaseReviewedLabel}>
                            <Star size={14} color="#f59e0b" fill="#f59e0b" /> Sudah Diulas
                          </div>
                        );
                      }

                      return (
                        <button
                          onClick={() => openReviewModal(item)}
                          className={styles.purchaseReviewBtn}
                        >
                          Beri Ulasan
                        </button>
                      );
                    })()}
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            title="Anda belum memiliki produk" 
            description="Produk yang sudah dibeli dan di-ACC oleh admin akan muncul di sini."
          />
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && reviewItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "var(--bg-card)", padding: "24px", borderRadius: "12px", width: "90%", maxWidth: "400px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-main)" }}>Beri Ulasan</h3>
              <button onClick={() => setIsReviewModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "16px" }}>
              Bagaimana pengalaman Anda membeli <strong>{reviewItem.product?.name}</strong>?
            </p>

            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", justifyContent: "center" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "4px",
                    color: star <= rating ? "#f59e0b" : "var(--border-color)",
                    transition: "color 0.2s"
                  }}
                >
                  <Star size={32} fill={star <= rating ? "#f59e0b" : "none"} />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Tulis ulasan Anda (Opsional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%", height: "100px", padding: "12px", borderRadius: "8px",
                border: "1px solid var(--border-color)", backgroundColor: "var(--bg-main)",
                color: "var(--text-main)", fontSize: "14px", resize: "none", marginBottom: "16px",
                fontFamily: "inherit"
              }}
            />

            <button
              onClick={submitReview}
              disabled={isSubmitting}
              style={{
                width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "var(--primary)",
                color: "white", fontWeight: "bold", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
