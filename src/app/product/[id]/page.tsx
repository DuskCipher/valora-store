"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { Product, Variation } from "@/data/products";
import { useStore } from "@/context/StoreContext";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  ShoppingCart,
  Zap,
  RefreshCw,
  Heart,
  ShieldCheck,
  Eye,
  ExternalLink,
  Calendar,
  Star,
  ShoppingBag,
  Download,
  Lightbulb,
  CheckCircle2,
  Facebook,
  Twitter,
  Linkedin,
  Link2,
  ChevronDown
} from "lucide-react";
import styles from "./detail.module.css";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = params;
  const router = useRouter();
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const { supabaseUser, isLoggedIn } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [isProcessingFree, setIsProcessingFree] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let query = supabase
        .from('products')
        .select(`
          *,
          stores (
            name,
            logo_url
          ),
          product_variations (
            id, name, price, discount_price, discount_percentage
          )
        `);

      if (isUUID) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } else {
        // Compute real sales from transactions
        let realSold = data.sold || 0;
        let realDownloads = data.downloads || 0;
        
        try {
          const { data: txs } = await supabase
            .from("transactions")
            .select("details")
            .eq("type", "order")
            .eq("status", "approved");
            
          if (txs) {
            let computedSold = 0;
            txs.forEach((t: any) => {
              const items = t.details?.items || [];
              items.forEach((item: any) => {
                if ((item.product?.id || item.id) === data.id) {
                  computedSold += (item.quantity || 1);
                }
              });
            });
            // If computed is greater than static, use computed
            if (computedSold > realSold) {
              realSold = computedSold;
              realDownloads = computedSold;
            }
          }
        } catch (e) {
          console.error("Error fetching real sales:", e);
        }

        const mapped: Product = {
          id: data.id,
          name: data.name,
          description: data.description || "",
          price: (data.discount_price && Number(data.discount_price) < Number(data.price)) ? Number(data.discount_price) : Number(data.price),
          originalPrice: (data.discount_price && Number(data.discount_price) < Number(data.price)) ? Number(data.price) : undefined,
          rating: data.rating || 0.0,
          sold: realSold,
          downloads: realDownloads,
          views: (data.views || 0) + 1,
          images: data.image_urls && data.image_urls.length > 0 ? data.image_urls : (data.image_url ? [data.image_url] : ["https://via.placeholder.com/600"]),
          seller: {
            name: data.stores?.name || "Unknown Store",
            avatar: data.stores?.logo_url || (data.stores?.name ? data.stores.name.substring(0, 2).toUpperCase() : "US"),
            rating: 5.0
          },
          badges: [
            ...(data.is_instant ? ["INSTANT"] : []),
            ...(data.discount_percentage ? [`UP TO ${data.discount_percentage}% OFF`] : [])
          ],
          tags: data.tags || [],
          features: [],
          inStock: data.stock,
          lastUpdated: data.updated_at || data.created_at,
          category: data.category_id || "Uncategorized",
          demoUrl: data.preview_url || "",
          downloadUrl: data.file_url || "",
          variations: data.product_variations || []
        };
        setProduct(mapped);

        // Increment views in background
        supabase.rpc('increment_product_views', { p_id: data.id }).then(({ error: rpcError }) => {
          if (rpcError) {
            // Fallback if RPC doesn't exist
            supabase.from('products').update({ views: (data.views || 0) + 1 }).eq('id', data.id).then();
          }
        });
      }
      setIsLoading(false);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!product) return;
      try {
        const { data: txReviews } = await supabase
          .from("transactions")
          .select("*")
          .eq("type", "review")
          .order("created_at", { ascending: false });
          
        if (txReviews) {
          const productReviews = txReviews.filter((r: any) => r.details?.product_id === product.id);
          
          const userIds = [...new Set(productReviews.map((r: any) => r.user_id))];
          let profilesMap: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, email").in("id", userIds);
            if (profiles) {
              profiles.forEach((p: any) => { profilesMap[p.id] = p; });
            }
          }

          const mappedReviews = productReviews.map((r: any) => {
             const profile = profilesMap[r.user_id];
             let displayName = r.details?.reviewer_name || "Pengguna";
             let avatarUrl = r.details?.reviewer_avatar || "";
             
             if (!r.details?.reviewer_name && profile) {
               if (profile.full_name && profile.full_name.trim() !== "") {
                 displayName = profile.full_name;
               } else if (profile.email) {
                 displayName = profile.email.split('@')[0];
               }
               if (profile.avatar_url) avatarUrl = profile.avatar_url;
             }

             return {
               id: r.id,
               rating: r.details?.rating || 5,
               comment: r.details?.comment || "",
               created_at: r.created_at,
               profiles: {
                 ...profile,
                 full_name: displayName,
                 avatar_url: avatarUrl
               }
             };
          });

          setReviews(mappedReviews);
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
      }
    };
    fetchReviews();
  }, [product]);

  const formatPrice = (price: number) => {
    if (price === 0) return "Rp0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const floorRating = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floorRating) {
        stars.push(<Star key={i} size={14} style={{ fill: "#fbbf24", color: "#fbbf24" }} />);
      } else {
        stars.push(<Star key={i} size={14} style={{ color: "#94a3b8" }} />);
      }
    }
    return stars;
  };

  const avgRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length 
    : (product?.rating || 0);

  // Loading state
  if (isLoading) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
        <Header />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <p style={{ color: "#64748b", fontSize: "16px" }}>Memuat detail produk...</p>
        </div>
        <Footer />
      </main>
    );
  }

  // Not found state
  if (!product) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
        <Header />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>Produk Tidak Ditemukan</h2>
          <p style={{ color: "#64748b" }}>Produk yang Anda cari tidak tersedia.</p>
          <Link href="/" style={{ color: "var(--primary)", marginTop: "16px", fontWeight: 600 }}>← Kembali ke Beranda</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const activeVarIdx = selectedVariation 
    ? product.variations?.findIndex(v => v.id === selectedVariation.id) ?? -1
    : -1;
  const isWishlisted = product ? wishlist.includes(product.id) : false;

  const currentPrice = selectedVariation
    ? (selectedVariation.discount_price !== null && selectedVariation.discount_price !== undefined ? Number(selectedVariation.discount_price) : Number(selectedVariation.price))
    : product?.price ?? 0;
  
  const isFree = currentPrice === 0;

  const handleFreeCheckout = async () => {
    if (!isLoggedIn || !supabaseUser) {
      alert("Silakan login terlebih dahulu untuk mendapatkan produk ini.");
      router.push("/login");
      return;
    }

    setIsProcessingFree(true);
    try {
      const cartItem = {
        product: product,
        variation: selectedVariation,
        quantity: 1,
      };

      const { data: txData, error } = await supabase.from("transactions").insert({
        user_id: supabaseUser.id,
        type: "order",
        amount: 0,
        status: "approved",
        payment_method: "Gratis",
        details: {
          items: [cartItem],
          service_fee: 0,
          saldo_used: 0,
          buyer_email: supabaseUser.email,
          buyer_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "User"
        }
      }).select();

      if (error) throw error;

      // Update product stock and sold count
      if (product) {
        const { data: currentProduct } = await supabase
          .from("products")
          .select("stock, sold")
          .eq("id", product.id)
          .single();
          
        if (currentProduct) {
          await supabase
            .from("products")
            .update({
              stock: Math.max(0, (currentProduct.stock || 0) - 1),
              sold: (currentProduct.sold || 0) + 1
            })
            .eq("id", product.id);
        }
      }

      const txId = txData?.[0]?.id || "";
      router.push(`/payment/${txId}`);
    } catch (err: any) {
      alert("Gagal memproses transaksi: " + err.message);
    } finally {
      setIsProcessingFree(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert("Tautan produk berhasil disalin!"))
        .catch(() => alert("Gagal menyalin tautan."));
    }
  };

  const shareToSocial = (platform: string) => {
    if (typeof window === "undefined" || !product) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Beli ${product.name} di Valora Store!`);
    
    let shareUrl = "";
    if (platform === "facebook") {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === "twitter") {
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    } else if (platform === "linkedin") {
      shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
    }
    
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      {/* Header bar */}
      <Header />

      <div className={styles.container} style={{ overflowX: "hidden" }}>
        {/* Breadcrumbs Navigation */}
        <div className={styles.breadcrumbs}>
          <Link href="/" className={styles.breadcrumbLink}>All Products</Link>
          <span className={styles.breadcrumbSeparator}>&gt;</span>
          <span className={styles.breadcrumbLink}>{product.category}</span>
          <span className={styles.breadcrumbSeparator}>&gt;</span>
          <span style={{ fontWeight: 600 }}>{product.name}</span>
        </div>

        {/* Product Details Main Grid */}
        <div className={styles.mainGrid}>
          {/* Left Column: Media player, Seller Info, Specs */}
          <div className={styles.leftCol}>
            
            {/* Mobile/Desktop Product Title (can be styled/ordered independently) */}
            <div className={styles.productTitleSection}>
              <h1 className={styles.productTitle}>{product.name}</h1>
            </div>

            {/* Gallery Media Panel */}
            <div className={styles.mediaPanel}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[activeMediaIdx]}
                alt={`${product.name} gallery ${activeMediaIdx}`}
                className={styles.mediaImage}
              />

              {/* Prev / Next controls */}
              <button
                onClick={() => setActiveMediaIdx((prev) => (prev - 1 + product.images.length) % product.images.length)}
                className={`${styles.arrowBtn} ${styles.prevBtn}`}
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setActiveMediaIdx((prev) => (prev + 1) % product.images.length)}
                className={`${styles.arrowBtn} ${styles.nextBtn}`}
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>

              {/* Mock Play Overlay on first slide removed */}

              <span className={styles.photoIndicator}>
                {product.images.length} photos
              </span>
            </div>

            {/* Seller profile card */}
            <div className={styles.sellerCard}>
              <div className={styles.sellerDetails}>
                <Link href={`/shop/details/${encodeURIComponent(product.seller.name)}`} className={styles.sellerAvatar} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.seller.avatar?.startsWith('http') ? (
                    <img src={product.seller.avatar} alt={product.seller.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    product.seller.avatar
                  )}
                </Link>
                <div className={styles.sellerText}>
                  <Link href={`/shop/details/${encodeURIComponent(product.seller.name)}`} className={styles.sellerName} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {product.seller.name}
                  </Link>
                  <div className={styles.sellerStatus}>
                    <div className={styles.statusDot}></div>
                    <span>Aktif</span>
                    <span>•</span>
                    <span className={styles.sellerRatingText}>
                      <Star size={14} style={{ fill: "#fbbf24", color: "#fbbf24" }} /> {Number(product.seller?.rating || 0) > 0 ? Number(product.seller.rating).toFixed(1) : "0.0"} Seller
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.sellerActions}>
                <div className={styles.statsRow}>
                  <span style={{ display: "flex", gap: "6px", alignItems: "center" }}><ShoppingBag size={14} color="var(--primary)" /> <strong>{product.sold}</strong> Sales</span>
                  <span style={{ display: "flex", gap: "6px", alignItems: "center" }}><Download size={14} color="var(--primary)" /> <strong>{product.downloads}</strong> Downloads</span>
                </div>
                <button className={styles.sellerBtnChat}>
                  Chat Seller
                </button>
              </div>
            </div>

            {/* Description & Features Info Panel */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionHeader}>Deskripsi Produk</h3>
              <div 
                className={styles.description} 
                style={{ wordBreak: "break-word", overflow: "hidden" }}
                dangerouslySetInnerHTML={{ __html: product.description || "" }}
              />

              {product.demoUrl && (
                <div className={styles.description} style={{ marginTop: "16px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <Lightbulb size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: "2px" }} /> 
                  <div style={{ wordBreak: "break-word", lineHeight: "1.6" }}>
                    <strong>Demo Link:</strong> Coba fitur langsung dengan mengetuk{" "}
                    <a
                      href={product.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600, wordBreak: "break-all" }}
                    >
                      {product.demoUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {product.features && product.features.length > 0 && (
              <div className={styles.infoSection}>
                <h3 className={styles.sectionHeader}>Fitur Utama</h3>
                <ul className={styles.featureList}>
                  {product.features.map((feature, idx) => (
                    <li key={idx} className={styles.featureItem}>
                      <Check size={18} className={styles.checkIcon} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}


          </div>

          {/* Right Column: Sticky Purchase Details Sidebar */}
          <div className={styles.rightCol}>
            {/* Product Info Card */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                PRODUCT INFO
              </div>
              <div className={styles.cardRow}>
                <span className={styles.rowLabel}>
                  <Eye size={16} /> Preview
                </span>
                {product.demoUrl ? (
                  <a href={product.demoUrl} target="_blank" rel="noopener noreferrer" className={styles.rowValueLink}>
                    Live Preview <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className={styles.rowValue}>No Preview</span>
                )}
              </div>

              <div className={styles.cardRow}>
                <span className={styles.rowLabel}>
                  <Zap size={16} /> Pengiriman
                </span>
                {product.badges?.includes("INSTANT") ? (
                  <span className={styles.rowValue} style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Zap size={16} fill="var(--primary)" /> Instant
                  </span>
                ) : (
                  <span className={styles.rowValue}>Non-Instant</span>
                )}
              </div>

              <div className={styles.cardRow}>
                <span className={styles.rowLabel}>
                  <RefreshCw size={16} /> Gratis Update
                </span>
                <span className={styles.rowValue} style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  Yes <Check size={16} />
                </span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.rowLabel}>
                  <Calendar size={16} /> Pembaruan terakhir
                </span>
                <span className={styles.rowValue}>
                  {new Date(product.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.rowLabel}>
                  <Star size={16} /> Rating
                </span>
                <span className={styles.rowValue} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <span style={{ display: "flex", gap: "2px" }}>{renderStars(avgRating || 0)}</span>
                  <span>{avgRating > 0 ? avgRating.toFixed(1) : "0.0"} ({reviews.length} Ulasan)</span>
                </span>
              </div>

              <div className={styles.cardRow}>
                <span className={styles.rowLabel}>
                  <Eye size={16} /> Dilihat
                </span>
                <span className={styles.rowValue}>{product.views >= 1000 ? `${(product.views / 1000).toFixed(1)}K` : product.views} times</span>
              </div>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className={styles.tagCard}>
                <div className={styles.tagLabel}>TAG</div>
                <div className={styles.tagGrid}>
                  {product.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.purchaseCard}>
              <div className={styles.priceContainer}>
                <div className={styles.priceRow}>
                  <span className={styles.price}>
                    {selectedVariation
                      ? (selectedVariation.discount_price ? formatPrice(Number(selectedVariation.discount_price)) : formatPrice(Number(selectedVariation.price)))
                      : (product.price === 0 ? "Rp0" : formatPrice(product.price))}
                  </span>
                  {(selectedVariation ? selectedVariation.discount_price : product.originalPrice) && (
                    <span className={styles.slashedPrice}>
                      {selectedVariation ? formatPrice(Number(selectedVariation.price)) : formatPrice(product.originalPrice!)}
                    </span>
                  )}
                </div>
                <span className={styles.stockBadge} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <CheckCircle2 size={12} fill="var(--primary)" color="white" /> {product.inStock} In Stock
                </span>
              </div>

              {/* Variations Selector */}
              {product.variations && product.variations.length > 0 && (
                <div style={{ padding: '0 20px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', display: 'block' }}>PILIH VARIASI</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedVariation(null)}
                      style={{
                        padding: '10px 14px',
                        border: selectedVariation === null ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: selectedVariation === null ? '#f0fdf4' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>Standar (Tanpa Variasi)</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(product.price)}</span>
                    </button>
                    {product.variations.map(variation => {
                      const varPrice = (variation.discount_price && Number(variation.discount_price) < Number(variation.price)) ? Number(variation.discount_price) : Number(variation.price);
                      return (
                        <button
                          key={variation.id}
                          onClick={() => setSelectedVariation(variation)}
                          style={{
                            padding: '10px 14px',
                            border: selectedVariation?.id === variation.id ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                            borderRadius: '6px',
                            background: selectedVariation?.id === variation.id ? '#f0fdf4' : '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{variation.name}</span>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {variation.discount_price && (
                              <span style={{ textDecoration: 'line-through', fontSize: '12px', color: '#94a3b8' }}>
                                {formatPrice(Number(variation.price))}
                              </span>
                            )}
                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(varPrice)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* What You Get checklist */}
              <div className={styles.whatYouGet}>
                <span className={styles.wygTitle}>WHAT YOU GET</span>

                <div className={styles.wygItem}>
                  <Zap size={16} className={styles.wygIcon} />
                  <span>Instant delivery — get it right after payment</span>
                </div>

                <div className={styles.wygItem}>
                  <RefreshCw size={16} className={styles.wygIcon} />
                  <span>Free updates — always get the latest version</span>
                </div>

                <div className={styles.wygItem}>
                  <ShieldCheck size={16} className={styles.wygIcon} />
                  <span>Secure transaction guaranteed by Valora Store_</span>
                </div>
              </div>

              {/* Wishlist Toggle Action */}
              <button
                onClick={() => toggleWishlist(product.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: isWishlisted ? "var(--danger)" : "var(--text-muted)",
                  fontWeight: 600,
                  marginTop: "5px"
                }}
              >
                <Heart size={16} fill={isWishlisted ? "var(--danger)" : "none"} />
                {isWishlisted ? "Dihapus dari Wishlist" : "Simpan ke Wishlist"}
              </button>

              {/* Purchase Action Buttons */}
              <div className={styles.buyActions}>
                {isFree ? (
                  <button 
                    onClick={handleFreeCheckout} 
                    className={styles.btnSecondary} 
                    style={{ width: "100%" }}
                    disabled={isProcessingFree}
                  >
                    {isProcessingFree ? "Memproses..." : "Dapatkan Gratis"}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { addToCart(product, selectedVariation || undefined); router.push("/checkout"); }} className={styles.btnSecondary}>
                      Beli Sekarang
                    </button>
                    <button onClick={() => { addToCart(product, selectedVariation || undefined); alert(`Berhasil menambahkan "${product.name}" ke keranjang!`); }} className={styles.btnPrimary}>
                      <ShoppingCart size={18} />
                      +Keranjang
                    </button>
                  </>
                )}
              </div>

              <a href="#" className={styles.reportBtn}>
                Laporkan produk ini?
              </a>
            </div>
          </div>
        </div>

        {/* Share & Reviews (Full Width) */}
        <div className={styles.shareAndReviews} style={{ marginTop: "40px" }}>
          <div className={styles.shareSection}>
            <span className={styles.shareText}>Share</span>
            <div className={styles.shareButtons}>
              <button className={styles.shareBtn} onClick={() => shareToSocial("facebook")}><Facebook size={16} /></button>
              <button className={styles.shareBtn} onClick={() => shareToSocial("twitter")}><Twitter size={16} /></button>
              <button className={styles.shareBtn} onClick={() => shareToSocial("linkedin")}><Linkedin size={16} /></button>
              <button className={styles.shareBtnCopy} onClick={handleCopyLink}><Link2 size={16} /> Copy Link</button>
            </div>
          </div>

          <div className={styles.reviewsSection}>
            <div className={styles.reviewsHeader}>
              <span className={styles.reviewsTitle}>Product reviews ({reviews.length})</span>
            </div>

            {/* List of Reviews */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
              {reviews.map((r, i) => (
                <div key={r.id || i} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <img
                      src={r.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${r.profiles?.full_name || "User"}&background=random`}
                      alt={r.profiles?.full_name}
                      style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "14px", color: "var(--text-main)" }}>
                        {r.profiles?.full_name}
                      </div>
                      <div style={{ display: "flex", gap: "2px", marginTop: "2px" }}>
                        {[...Array(5)].map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            size={12}
                            fill={starIdx < r.rating ? "var(--primary)" : "none"}
                            color={starIdx < r.rating ? "var(--primary)" : "var(--text-muted)"}
                          />
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                      {new Date(r.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 0 48px", lineHeight: "1.5" }}>
                    {r.comment}
                  </p>
                </div>
              ))}

              {reviews.length === 0 && (
                <div className={styles.noReviews}>
                  Belum ada ulasan untuk produk ini.
                </div>
              )}
            </div>

            {/* Write Review Form Removed - Users must use Pembelian Saya */}
          </div>
        </div>

        {/* Other Products from Seller - will be added later */}
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
