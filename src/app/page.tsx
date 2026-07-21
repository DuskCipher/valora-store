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
      let { data, error } = await supabase
        .from('products')
        .select(`
          *,
          stores (
            name,
            logo_url,
            is_verified
          ),
          categories (
            name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Fallback if is_verified column doesn't exist in Supabase yet
      if (error && error.message.includes('is_verified')) {
        const fallback = await supabase
          .from('products')
          .select(`
            *,
            stores (
              name,
              logo_url
            ),
            categories (
              name
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }

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
            rating: 5.0,
            is_verified: item.stores?.is_verified || false
          },
          badges: [
            ...(item.is_instant ? ["INSTANT"] : []),
            ...(item.discount_percentage ? [`UP TO ${item.discount_percentage}% OFF`] : [])
          ],
          tags: item.tags || [],
          features: [],
          inStock: item.stock,
          lastUpdated: item.updated_at || item.created_at,
          category: item.categories?.name || item.category_id || "Uncategorized",
          demoUrl: item.preview_url || "",
          slug: item.slug
        }));
        
        // Real sales computation via client-side fetch is removed
        // karena menyebabkan bug "0 terjual" pada user yang belum login
        // akibat kebijakan RLS (Row Level Security) yang memblokir akses ke tabel transaksi.
        // Sekarang kita akan menggunakan kolom 'sold' langsung dari tabel products!
        
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
