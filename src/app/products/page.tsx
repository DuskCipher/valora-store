"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { Search, Filter, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import styles from "./page.module.css";

const CATEGORIES = [
  "Semua",
  "Website",
  "Ebook",
  "Graphic Design",
  "Akun Digital",
  "Web Design & Templates",
  "Source Code"
];

const SORT_OPTIONS = ["Popular", "Terlaris", "Terbaru", "Terlama"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSort, setActiveSort] = useState("Popular");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [deliveryFilter, setDeliveryFilter] = useState("All");

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [openFilters, setOpenFilters] = useState({
    category: true,
    rating: false,
    delivery: false,
    other: false,
    price: false
  });

  const toggleFilter = (key: keyof typeof openFilters) => {
    setOpenFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          stores (
            name,
            logo_url
          )
        `)
        .eq('is_active', true);

      if (error) {
        console.error("Error fetching products:", error);
      } else if (data) {
        const mappedProducts: Product[] = data.map((item: any) => ({
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
        
        setProducts(mappedProducts);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Category filter
    if (activeCategory !== "Semua") {
      result = result.filter(p => p.category === activeCategory);
    }

    // Rating filter
    if (ratingFilter !== "All") {
      const minRating = parseInt(ratingFilter);
      if (!isNaN(minRating)) {
        result = result.filter(p => p.rating >= minRating);
      }
    }

    // Delivery filter
    if (deliveryFilter !== "All") {
      if (deliveryFilter === "Instant") {
        result = result.filter(p => p.badges?.includes("INSTANT"));
      } else {
        result = result.filter(p => !p.badges?.includes("INSTANT"));
      }
    }

    // Sort
    switch (activeSort) {
      case "Terbaru":
        result.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
      case "Terlama":
        result.sort((a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());
        break;
      case "Terlaris":
        result.sort((a, b) => b.sold - a.sold);
        break;
      case "Popular":
      default:
        result.sort((a, b) => b.views - a.views);
        break;
    }

    return result;
  }, [products, searchTerm, activeCategory, activeSort, ratingFilter, deliveryFilter]);

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      <Header />
      
      <div className={styles.container}>
        {/* Category Pills */}
        <div className={styles.topSection}>
          <div className={styles.categoryPills}>
            {CATEGORIES.map(cat => (
              <div 
                key={cat} 
                className={`${styles.pill} ${activeCategory === cat ? styles.active : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.mainArea}>
          {/* Mobile filter button */}
          <button 
            className={styles.mobileFilterBtn}
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <Filter size={16} /> Filters
          </button>

          {/* Sidebar */}
          <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.mobileOpen : ""}`}>
            <div className={styles.sidebarHeader}>
              <SlidersHorizontal size={20} style={{ color: '#64748b' }} />
            </div>
            
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)', marginBottom: '16px' }}>Filters</div>

            {/* Search */}
            <div className={styles.filterGroup} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div className={styles.searchContainer}>
                <Search size={16} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search Product" 
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', borderBottom: '1px solid #cbd5e1', borderRadius: 0, paddingLeft: '32px' }}
                />
              </div>
            </div>

            {/* Category */}
            <div className={styles.filterGroup} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div 
                className={styles.filterTitle} 
                onClick={() => toggleFilter("category")}
                style={{ cursor: "pointer", marginBottom: openFilters.category ? "16px" : "0" }}
              >
                Category {openFilters.category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {openFilters.category && (
                <div>
                  {CATEGORIES.map(cat => (
                    <label key={cat} className={styles.radioLabel}>
                      <input type="radio" name="category" className={styles.radioInput} checked={activeCategory === cat} onChange={() => setActiveCategory(cat)} />
                      {cat}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Rating */}
            <div className={styles.filterGroup} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div 
                className={styles.filterTitle} 
                onClick={() => toggleFilter("rating")}
                style={{ cursor: "pointer", marginBottom: openFilters.rating ? "16px" : "0" }}
              >
                Rating {openFilters.rating ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {openFilters.rating && (
                <div>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="rating" className={styles.radioInput} checked={ratingFilter === "All"} onChange={() => setRatingFilter("All")} />
                    All Rating
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="rating" className={styles.radioInput} checked={ratingFilter === "5"} onChange={() => setRatingFilter("5")} />
                    5 stars
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="rating" className={styles.radioInput} checked={ratingFilter === "4"} onChange={() => setRatingFilter("4")} />
                    4 stars & up
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="rating" className={styles.radioInput} checked={ratingFilter === "3"} onChange={() => setRatingFilter("3")} />
                    3 stars & up
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="rating" className={styles.radioInput} checked={ratingFilter === "2"} onChange={() => setRatingFilter("2")} />
                    2 stars & up
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="rating" className={styles.radioInput} checked={ratingFilter === "1"} onChange={() => setRatingFilter("1")} />
                    1 star & up
                  </label>
                </div>
              )}
            </div>

            {/* Delivery */}
            <div className={styles.filterGroup} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div 
                className={styles.filterTitle} 
                onClick={() => toggleFilter("delivery")}
                style={{ cursor: "pointer", marginBottom: openFilters.delivery ? "16px" : "0" }}
              >
                Delivery {openFilters.delivery ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {openFilters.delivery && (
                <div>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="delivery" className={styles.radioInput} checked={deliveryFilter === "All"} onChange={() => setDeliveryFilter("All")} />
                    All Delivery
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="delivery" className={styles.radioInput} checked={deliveryFilter === "Instant"} onChange={() => setDeliveryFilter("Instant")} />
                    Instant
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="delivery" className={styles.radioInput} checked={deliveryFilter === "Non-Instant"} onChange={() => setDeliveryFilter("Non-Instant")} />
                    Non-Instant
                  </label>
                </div>
              )}
            </div>

            {/* Other */}
            <div className={styles.filterGroup} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div 
                className={styles.filterTitle} 
                onClick={() => toggleFilter("other")}
                style={{ cursor: "pointer", marginBottom: openFilters.other ? "16px" : "0" }}
              >
                Other {openFilters.other ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {openFilters.other && (
                <div style={{ fontSize: '13px', color: '#64748b' }}>No other filters available.</div>
              )}
            </div>

            {/* Price */}
            <div className={styles.filterGroup}>
              <div 
                className={styles.filterTitle} 
                onClick={() => toggleFilter("price")}
                style={{ cursor: "pointer", marginBottom: openFilters.price ? "16px" : "0" }}
              >
                Price {openFilters.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {openFilters.price && (
                <div style={{ fontSize: '13px', color: '#64748b' }}>Price range filter coming soon.</div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className={styles.content}>
            <div className={styles.resultsHeader}>
              <div className={styles.resultsCount}>
                {filteredAndSortedProducts.length} products from {products.length} products shown
              </div>
              <div className={styles.sortControls}>
                {SORT_OPTIONS.map(opt => (
                  <button 
                    key={opt}
                    className={`${styles.sortBtn} ${activeSort === opt ? styles.active : ""}`}
                    onClick={() => setActiveSort(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                Memuat produk...
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className={styles.grid}>
                {filteredAndSortedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                Tidak ada produk yang sesuai dengan kriteria filter Anda.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
