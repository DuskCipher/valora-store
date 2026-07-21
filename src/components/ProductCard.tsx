"use client";

import React from "react";
import Link from "next/link";
import { Search, ExternalLink, Star, CheckCircle2 } from "lucide-react";
import { Product } from "@/data/products";
import { useStore } from "@/context/StoreContext";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { setPreviewProduct } = useStore();

  const formatPrice = (price: number) => {
    if (price === 0) return "Rp0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(price);
  };

  // Render rating stars (max 5)
  const renderStars = (rating: number) => {
    const stars = [];
    const floorRating = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floorRating) {
        stars.push(<Star key={i} size={12} className={`${styles.starFilled} ${styles.starFilled}`} />);
      } else {
        stars.push(<Star key={i} size={12} className={styles.starEmpty} />);
      }
    }
    return stars;
  };

  const mainBadge = product.badges[0];
  const discountBadge = product.badges.find((b) => b.includes("OFF"));

  return (
    <div className={styles.card}>
      {/* Product Image Section */}
      <div className={styles.imageContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.images[0]} alt={product.name} className={styles.image} />

        {/* Floating Badges */}
        <div className={styles.badgeLeft}>
          {mainBadge && (
            <span
              className={`${styles.badge} ${
                mainBadge === "INSTANT"
                  ? styles.badgeGreen
                  : mainBadge.includes("DAYS")
                  ? styles.badgeSlate
                  : styles.badgeRed
              }`}
            >
              {mainBadge}
            </span>
          )}
          {discountBadge && (
            <span className={`${styles.badge} ${styles.badgeRed}`}>{discountBadge}</span>
          )}
        </div>

        {/* Bottom Floating Delivery Badge */}
        <span className={styles.instantBadgeFloating}>+ Instant</span>

        {/* Hover Overlay */}
        <div className={styles.overlay}>
          <button
            onClick={() => setPreviewProduct(product)}
            className={styles.overlayAction}
          >
            <div className={styles.overlayIcon}>
              <Search size={20} />
            </div>
            <span>Preview</span>
          </button>

          <Link href={`/product/${product.slug || product.id}`} className={styles.overlayAction}>
            <div className={styles.overlayIcon}>
              <ExternalLink size={20} />
            </div>
            <span>Detail</span>
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className={styles.info}>
        <h3 className={styles.title}>{product.name}</h3>

        <div className={styles.sellerRow}>
          <div className={styles.sellerInfo}>
            <Link href={`/shop/details/${encodeURIComponent(product.seller.name)}`} className={styles.sellerAvatar} style={{ textDecoration: 'none' }}>
              {product.seller.avatar?.startsWith('http') ? (
                <img src={product.seller.avatar} alt={product.seller.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                product.seller.avatar
              )}
            </Link>
            <Link href={`/shop/details/${encodeURIComponent(product.seller.name)}`} className={styles.sellerName} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {product.seller.name}
              {product.seller.is_verified && <CheckCircle2 size={12} color="#3b82f6" />}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className={styles.footerRow}>
        <div className={styles.footerLeft}>
          <div className={styles.rating}>
            <div className={styles.stars}>{renderStars(product.rating || 5.0)}</div>
          </div>
          <span className={styles.salesCount}>{product.sold + (product.downloads || 0)} Terjual</span>
        </div>
        
        <div className={styles.priceContainer}>
          <span className={product.price === 0 ? styles.priceFree : styles.price}>
            {product.price === 0 ? "Rp0" : formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className={styles.originalPrice}>
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
