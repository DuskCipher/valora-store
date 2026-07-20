"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Heart,
  ShoppingCart,
  Play,
  Check,
  Eye,
  Star,
  ExternalLink,
  Zap,
  RefreshCw,
  Calendar,
  Layers,
  MessageSquare,
  ShieldCheck,
  Globe,
  ShoppingBag,
  Download,
  CheckCircle2,
  Store
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import styles from "./ProductPreviewModal.module.css";

export const ProductPreviewModal: React.FC = () => {
  const {
    previewProduct,
    setPreviewProduct,
    wishlist,
    toggleWishlist,
    addToCart
  } = useStore();

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const router = useRouter();

  // Reset active slide when product changes
  useEffect(() => {
    setActiveMediaIndex(0);
  }, [previewProduct]);

  if (!previewProduct) return null;

  const product = previewProduct;
  const isWishlisted = wishlist.includes(product.id);

  const formatPrice = (price: number) => {
    if (price === 0) return "Rp0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = () => {
    addToCart(product);
    alert(`Berhasil menambahkan "${product.name}" ke keranjang!`);
  };

  const handleBuyNow = () => {
    addToCart(product);
    setPreviewProduct(null);
    router.push("/checkout");
  };

  // Render rating stars (max 5)
  const renderStars = (rating: number) => {
    const stars = [];
    const floorRating = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= floorRating) {
        stars.push(<Star key={i} size={14} className={styles.starFilled} style={{ fill: "#fbbf24", color: "#fbbf24" }} />);
      } else {
        stars.push(<Star key={i} size={14} className={styles.starEmpty} style={{ color: "#94a3b8" }} />);
      }
    }
    return stars;
  };

  return (
    <div className={styles.overlay} onClick={() => setPreviewProduct(null)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>{product.name}</h2>
            <div className={styles.meta}>
              <span className={styles.sellerBadge} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Store size={14} color="#f43f5e" /> {product.seller.name}
              </span>
              <span>•</span>
              <div className={styles.rating} style={{ display: "inline-flex", gap: "2px", alignItems: "center" }}>
                <Star size={12} style={{ fill: "#fbbf24", color: "#fbbf24" }} />
                <span>{product.rating > 0 ? product.rating.toFixed(1) : "0.0"}</span>
              </div>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistBtnActive : ""}`}
                aria-label="Add to Wishlist"
              >
                <Heart size={16} fill={isWishlisted ? "var(--danger)" : "none"} />
              </button>
            </div>
          </div>
          <button
            onClick={() => setPreviewProduct(null)}
            className={styles.closeBtn}
            aria-label="Close Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className={styles.content}>
          {/* Left Column: Media Gallery */}
          <div className={styles.galleryColumn}>
            <div className={styles.activeMediaContainer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[activeMediaIndex] || product.images[0]}
                alt={`${product.name} gallery ${activeMediaIndex}`}
                className={styles.activeMedia}
              />

              {/* Video overlay removed as requested */}
            </div>

            {/* Gallery Thumbnails */}
            <div className={styles.thumbnails}>
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`${styles.thumbnail} ${
                    idx === activeMediaIndex ? styles.thumbnailActive : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`Thumbnail ${idx}`}
                    className={styles.thumbnailImg}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Info Details */}
          <div className={styles.infoColumn}>
            <div className={styles.descText} dangerouslySetInnerHTML={{ __html: product.description || "" }} />

            {product.demoUrl && (
              <div className={styles.demoBox}>
                <strong>Demo Link:</strong>{" "}
                <a
                  href={product.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.demoLink}
                >
                  {product.demoUrl.replace("https://", "")}
                </a>
              </div>
            )}

            {/* Sales & Downloads */}
            <div className={styles.statsRow}>
              <span className={styles.statsItem} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <ShoppingBag size={14} color="var(--primary)" /> {product.sold} Terjual
              </span>
              <span className={styles.statsItem} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <Download size={14} color="var(--primary)" /> {product.downloads} Downloads
              </span>
            </div>

            {/* Tags */}
            <div className={styles.infoCard}>
              <div className={styles.infoCardHeader}>
                PRODUCT INFO
              </div>
              <div className={styles.cardRow}>
                <span className={styles.rowLabel}>
                  <Eye size={16} /> Preview
                </span>
                {product.demoUrl ? (
                  <a
                    href={product.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.rowValueLink}
                  >
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
                  <span style={{ display: "flex", gap: "2px" }}>{renderStars(product.rating || 5.0)}</span>
                  <span>{product.rating > 0 ? product.rating.toFixed(1) : "0.0"} ({product.sold})</span>
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
              <div className={styles.tagContainer}>
                <span className={styles.tagLabel}>TAG</span>
                <div className={styles.tagGrid}>
                  {product.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className={styles.footer}>
          <button onClick={handleBuyNow} className={styles.btnSecondary}>
            Beli Sekarang
          </button>
          <button onClick={handleAddToCart} className={styles.btnPrimary}>
            <ShoppingCart size={18} />
            +Keranjang {formatPrice(product.price)}
          </button>
        </div>
      </div>
    </div>
  );
};
