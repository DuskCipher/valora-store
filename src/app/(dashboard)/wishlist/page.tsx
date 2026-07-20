"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { supabase } from "@/lib/supabase";
import { Product } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { HeartCrack } from "lucide-react";
import styles from "./page.module.css";

export default function WishlistPage() {
  const { wishlist } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setIsLoading(true);

      if (wishlist.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          stores (
            name,
            logo_url
          )
        `)
        .in("id", wishlist)
        .eq("is_active", true);

      if (error) {
        console.error("Error fetching wishlist:", error);
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
          images:
            item.image_urls && item.image_urls.length > 0
              ? item.image_urls
              : item.image_url
              ? [item.image_url]
              : ["https://via.placeholder.com/600"],
          seller: {
            name: item.stores?.name || "Unknown Store",
            avatar:
              item.stores?.logo_url ||
              (item.stores?.name
                ? item.stores.name.substring(0, 2).toUpperCase()
                : "US"),
            rating: 5.0,
          },
          badges: item.is_instant ? ["INSTANT"] : [],
          tags: item.tags || [],
          features: [],
          inStock: item.stock,
          lastUpdated: item.updated_at || item.created_at,
          category: item.category_id || "Uncategorized",
          demoUrl: item.preview_url || "",
          slug: item.slug,
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

    fetchWishlistProducts();
  }, [wishlist]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Wishlist Saya</h1>
        <p className={styles.subtitle}>
          Produk-produk favorit yang telah Anda simpan.{" "}
          {products.length > 0 && (
            <span className={styles.count}>{products.length} produk</span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Memuat wishlist...</p>
        </div>
      ) : products.length > 0 ? (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <HeartCrack size={52} className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Wishlist Masih Kosong</h2>
          <p className={styles.emptyDesc}>
            Anda belum menyimpan produk apapun. Yuk, jelajahi produk dan
            temukan favoritmu!
          </p>
          <Link href="/" className={styles.browseBtn}>
            Jelajahi Produk
          </Link>
        </div>
      )}
    </div>
  );
}
