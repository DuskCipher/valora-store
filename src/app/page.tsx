"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import { Product } from "@/data/products";
import { useStore } from "@/context/StoreContext";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

export default function Home() {
  const { searchTerm } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else if (data) {
        let mappedProducts: Product[] = data.map((item: any) => ({
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
        
        // Compute real sales from transactions to fix 0 sales bug
        try {
          const { data: txs } = await supabase
            .from("transactions")
            .select("details")
            .eq("type", "order")
            .eq("status", "approved");
            
          if (txs) {
            const salesMap: Record<string, number> = {};
            txs.forEach((t: any) => {
              const items = t.details?.items || [];
              items.forEach((item: any) => {
                const pid = item.product?.id || item.id;
                if (pid) {
                  salesMap[pid] = (salesMap[pid] || 0) + (item.quantity || 1);
                }
              });
            });
            
            mappedProducts = mappedProducts.map(p => ({
              ...p,
              sold: Math.max(p.sold, salesMap[p.id] || 0)
            }));
          }
        } catch (e) {
          console.error("Error computing real sales:", e);
        }
        
        setProducts(mappedProducts);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className={styles.main}>
      {/* Navbar Header */}
      <Header />

      {/* Slide Banner Promo */}
      <HeroCarousel />

      {/* Main Container */}
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Produk Terbaru</h2>

        {isLoading ? (
          <div className={styles.noResults}>
            <p>Memuat produk...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className={styles.grid}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            <h3 className={styles.noResultsTitle}>Produk Tidak Ditemukan</h3>
            <p>Tidak ada produk digital yang cocok dengan kata kunci &quot;{searchTerm}&quot;.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
