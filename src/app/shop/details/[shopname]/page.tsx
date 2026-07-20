"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { Product } from "@/data/products";
import { Star, XCircle, Search, ChevronDown, CheckCircle2 } from "lucide-react";
import styles from "./page.module.css";

interface StoreProfile {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  created_at: string;
  city?: string;
  province?: string;
  postal_code?: string;
  address?: string;
  followers_count?: number;
}

export default function StoreDetailsPage({ params }: { params: { shopname: string } }) {
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowed, setIsFollowed] = useState(false);
  const [activeTab, setActiveTab] = useState("Produk");
  const [searchQuery, setSearchQuery] = useState("");
  const [storeReviews, setStoreReviews] = useState<any[]>([]);

  const shopNameParam = decodeURIComponent(params.shopname);

  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      setIsLoading(true);
      try {
        // Find store by name (case insensitive match via ilike is best, or replace dashes)
        // Since URL might be "smartapps" or "smart apps"
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .ilike('name', shopNameParam)
          .single();

        if (storeError || !storeData) {
          console.error("Store not found:", storeError);
          setIsLoading(false);
          return;
        }

        setStore(storeData);

        // Fetch products for this store
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            stores (
              name,
              logo_url
            )
          `)
          .eq('store_id', storeData.id)
          .eq('is_active', true);

        if (productsError) {
          console.error("Error fetching products:", productsError);
        } else if (productsData) {
          const mappedProducts: Product[] = productsData.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description || "",
            price: (item.discount_price && Number(item.discount_price) < Number(item.price)) ? Number(item.discount_price) : Number(item.price),
            originalPrice: (item.discount_price && Number(item.discount_price) < Number(item.price)) ? Number(item.price) : undefined,
            rating: item.rating || 0.0,
            sold: item.sold || 0,
            downloads: item.downloads || 0,
            views: item.views || 0,
            images: item.image_urls && item.image_urls.length > 0 ? item.image_urls : (item.image_url ? [item.image_url] : ["https://via.placeholder.com/600"]),
            seller: {
              name: item.stores?.name || "Unknown Store",
              avatar: item.stores?.logo_url || (item.stores?.name ? item.stores.name.substring(0, 2).toUpperCase() : "US"),
              rating: 5.0
            },
            badges: [
              ...(item.is_instant ? ["INSTANT"] : []),
              ...(item.discount_percentage ? [`UP TO ${item.discount_percentage}% OFF`] : [])
            ],
            tags: item.tags || [],
            features: [],
            inStock: item.stock,
            lastUpdated: item.updated_at || item.created_at,
            category: item.category_id || "Uncategorized",
            demoUrl: item.preview_url || "",
            slug: item.slug
          }));
          // Fetch real sales data from transactions
          const productIds = mappedProducts.map((p: any) => p.id);
          if (productIds.length > 0) {
            const { data: txs } = await supabase
              .from("transactions")
              .select("status, details")
              .eq("type", "order")
              .eq("status", "approved");
              
            if (txs) {
              let salesMap: Record<string, number> = {};
              txs.forEach((t: any) => {
                const items = t.details?.items || [];
                items.forEach((item: any) => {
                  const pid = item.product?.id || item.id;
                  if (productIds.includes(pid)) {
                    if (!salesMap[pid]) salesMap[pid] = 0;
                    salesMap[pid] += (item.quantity || 1);
                  }
                });
              });
              
              // Update mapped products with real sales
              mappedProducts.forEach(p => {
                p.sold = salesMap[p.id] || p.sold || 0;
              });
            }
          }

          setProducts(mappedProducts);

          // Fetch Reviews for all products in this store
          if (productIds.length > 0) {
            const { data: txReviews } = await supabase
              .from("transactions")
              .select("*")
              .eq("type", "review");

            if (txReviews) {
              const reviewsForStore = txReviews.filter((r: any) => productIds.includes(r.details?.product_id));
              
              // Map reviewers
              const userIds = Array.from(new Set(reviewsForStore.map((r: any) => r.user_id)));
              let profilesMap: any = {};
              if (userIds.length > 0) {
                 const { data: profilesData } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
                 profilesData?.forEach((p: any) => { profilesMap[p.id] = p; });
              }

              const enrichedReviews = reviewsForStore.map((r: any) => ({
                ...r,
                reviewerName: r.details?.reviewer_name || profilesMap[r.user_id]?.full_name || "Pengguna",
                productName: mappedProducts.find((p: any) => p.id === r.details?.product_id)?.name || "Produk"
              }));

              setStoreReviews(enrichedReviews);
            }
          }
        }

        // Check if followed in localStorage
        const followedStores = JSON.parse(localStorage.getItem('followed_stores') || '[]');
        if (followedStores.includes(storeData.id)) {
          setIsFollowed(true);
        }

      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreAndProducts();
  }, [shopNameParam]);

  const toggleFollow = async () => {
    if (!store) return;
    
    let followedStores = JSON.parse(localStorage.getItem('followed_stores') || '[]');
    let newFollowersCount = store.followers_count || 0;
    
    if (isFollowed) {
      followedStores = followedStores.filter((id: string) => id !== store.id);
      setIsFollowed(false);
      newFollowersCount = Math.max(0, newFollowersCount - 1);
    } else {
      followedStores.push(store.id);
      setIsFollowed(true);
      newFollowersCount += 1;
    }
    
    localStorage.setItem('followed_stores', JSON.stringify(followedStores));
    setStore({ ...store, followers_count: newFollowersCount });
    
    // Update Supabase followers count
    await supabase.from("stores").update({ followers_count: newFollowersCount }).eq("id", store.id);
  };

  const getJoinDateStr = (dateString: string) => {
    const joinDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - joinDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} hari lalu`;
    if (diffDays < 365) return `${Math.floor(diffDays/30)} bulan lalu`;
    return `setahun lalu`;
  };

  // Calculate totals
  const totalSales = products.reduce((acc, curr) => acc + (curr.sold || 0), 0);
  const totalRating = products.reduce((acc, curr) => acc + (curr.rating || 0), 0);
  const avgRating = products.length > 0 ? (totalRating / products.length).toFixed(2) : "0.00";

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      <Header />
      
      <div className={styles.container}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>Memuat profil toko...</div>
        ) : !store ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <h2>Toko Tidak Ditemukan</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>Toko dengan nama &quot;{shopNameParam}&quot; tidak dapat ditemukan.</p>
          </div>
        ) : (
          <>
            {/* Header Profile */}
            <div className={styles.profileHeader}>
              <div className={styles.logoContainer}>
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className={styles.logoImage} />
                ) : (
                  <span className={styles.logoPlaceholder}>{store.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <h1 className={styles.shopName}>{store.name}</h1>
              <div className={styles.onlineStatus}>Aktif</div>
              
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <Star size={14} fill="#94a3b8" color="#94a3b8" />
                  <Star size={14} fill="#94a3b8" color="#94a3b8" />
                  <Star size={14} fill="#94a3b8" color="#94a3b8" />
                  <Star size={14} fill="#94a3b8" color="#94a3b8" />
                  <Star size={14} fill="#94a3b8" color="#94a3b8" />
                  <span style={{ fontWeight: 600, marginLeft: "4px" }}>{avgRating}</span>
                  <span>({storeReviews.length} Ulasan)</span>
                </div>
                <div className={styles.statDot}></div>
                <div>{totalSales} Penjualan</div>
                <div className={styles.statDot}></div>
                <div>{products.length} Produk</div>
                <div className={styles.statDot}></div>
                <div>Bergabung {getJoinDateStr(store.created_at)}</div>
              </div>
              
              <button 
                className={`${styles.followBtn} ${isFollowed ? styles.followed : styles.unfollowed}`}
                onClick={toggleFollow}
              >
                {isFollowed ? (
                  <>
                    <XCircle size={16} /> Unfollow
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Follow
                  </>
                )}
              </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabsContainer}>
              {["Produk", "Ulasan", "Tentang"].map((tab) => (
                <button 
                  key={tab}
                  className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Layout Content */}
            <div className={styles.contentLayout}>
              {/* Sidebar Filters */}
              <div className={styles.sidebar}>
                <div className={styles.filterGroup}>
                  <div className={styles.filterTitle}>Filters</div>
                  <div className={styles.searchWrapper}>
                    <Search size={16} className={styles.searchIcon} />
                    <input 
                      type="text" 
                      placeholder="Search Product" 
                      className={styles.searchInput}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <div className={styles.filterTitle}>
                    Category <ChevronDown size={16} />
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <div className={styles.filterTitle}>
                    Rating <ChevronDown size={16} />
                  </div>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="rating" defaultChecked /> All Rating
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="rating" /> 5 stars
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="rating" /> 4 stars & up
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="rating" /> 3 stars & up
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="rating" /> 2 stars & up
                    </label>
                  </div>
                </div>
              </div>

              {/* Main Grid */}
              <div className={styles.productsGrid}>
                {activeTab === "Produk" ? (
                  filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      Tidak ada produk yang cocok dengan pencarian.
                    </div>
                  )
                ) : activeTab === "Tentang" ? (
                  <div style={{ gridColumn: '1 / -1', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>Profil Toko</h3>
                    <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>
                      {store.description || `${store.name} menciptakan aplikasi yang berkualitas sesuai kebutuhan.`}
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '18px' }}>📍</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>Alamat</div>
                          <div style={{ color: '#64748b', fontSize: '14px' }}>
                            {[store.city, store.province, store.address, store.postal_code].filter(Boolean).join(', ') || "Belum mengatur alamat"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginTop: '16px' }}>
                        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>{totalSales}</div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>Total Sales</div>
                        </div>
                        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>{products.length}</div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>Total Products</div>
                        </div>
                        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>{store.followers_count || 0}</div>
                          <div style={{ fontSize: '14px', color: '#64748b' }}>Followers</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === "Ulasan" ? (
                  <div style={{ gridColumn: '1 / -1', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#1e293b' }}>Ulasan Toko ({storeReviews.length})</h3>
                    {storeReviews.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {storeReviews.map((review, idx) => (
                          <div key={idx} style={{ paddingBottom: '20px', borderBottom: idx !== storeReviews.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                                {review.reviewerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{review.reviewerName}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                  Untuk produk: <span style={{ color: 'var(--primary)' }}>{review.productName}</span>
                                </div>
                              </div>
                              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                                <Star size={16} fill="#f59e0b" />
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{review.details?.rating || 5}</span>
                              </div>
                            </div>
                            <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.5, marginTop: '8px' }}>
                              {review.details?.comment || "Tidak ada komentar"}
                            </p>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                              {new Date(review.created_at).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyState}>
                        Toko ini belum memiliki ulasan.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    Fitur {activeTab} masih dalam tahap pengembangan.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      <Footer />
    </main>
  );
}
