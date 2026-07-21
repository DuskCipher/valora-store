"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import styles from "./HeroCarousel.module.css";

interface SlideData {
  badges: { text: string; type: "orange" | "green" }[];
  bulletPoints: string[];
  subtitle: string;
  image: string;
  className: string;
}

const defaultSlides: SlideData[] = [
  {
    badges: [
      { text: "INSTANT", type: "green" },
      { text: "AFFILIATE + 60%", type: "orange" }
    ],
    bulletPoints: [
      "Tanpa batasan kirim pesan",
      "Fitur lengkap (Autoreply, api, blast)",
      "Install di server anda sendiri!",
      "Hanya sekali pembayaran",
      "Free update!"
    ],
    subtitle: "Whatsapp Gateway v9.7.2 Multi Devices | Rp500.000 - Rp2.500.000",
    image: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=600&auto=format&fit=crop&q=80",
    className: styles.slide1
  },
  {
    badges: [
      { text: "INSTANT", type: "green" },
      { text: "UP TO 33% OFF", type: "orange" }
    ],
    bulletPoints: [
      "PPOB SPA Source Code - Mpedia",
      "Transaksi Pulsa & Tagihan Otomatis",
      "Dashboard SPA Sangat Cepat",
      "Integrasi Payment Gateway",
      "Sistem Auto-deposit saldo"
    ],
    subtitle: "PPOB SPA Source Code - Mpedia | Rp1.000.000",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
    className: styles.slide2
  }
];

const defaultSideBanner = {
  badge_text: "HOT PROMO",
  title: "Diskon Spesial 50%",
  description: "Dapatkan source code MPWA eksklusif dengan fitur terbaru bulan ini!",
  button_text: "Beli Sekarang",
  link_url: "#"
};

export const HeroCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [sideBanner, setSideBanner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("order_index", { ascending: true });

        if (error) {
          console.error("Error fetching banners:", error);
          setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const carouselData = data
            .filter((b) => b.type === "carousel" && !b.is_hidden)
            .map((b) => ({
              badges: Array.isArray(b.badges) ? b.badges : [],
              bulletPoints: Array.isArray(b.bullet_points) ? b.bullet_points : [],
              subtitle: b.subtitle || "",
              image: b.image_url || "",
              className: styles.slide1
            }));

          const sideBannerData = data.find((b) => b.type === "side_banner" && !b.is_hidden);

          if (carouselData.length > 0) {
            setSlides(carouselData);
          }
          if (sideBannerData) {
            setSideBanner(sideBannerData);
          } else {
            setSideBanner(null);
          }
        }
      } catch (err) {
        console.error("Error load banners:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  if (isLoading) {
    return (
      <section className={styles.heroGrid}>
        <div style={{ height: "350px", backgroundColor: "var(--bg-input)", borderRadius: "16px", opacity: 0.5 }} />
        <div style={{ height: "350px", backgroundColor: "var(--bg-input)", borderRadius: "16px", opacity: 0.5 }} />
      </section>
    );
  }

  if (slides.length === 0 && !sideBanner) return null;

  return (
    <section className={styles.heroGrid}>
      {slides.length > 0 && (
        <div className={styles.carouselContainer}>
          <div className={styles.slidesWrapper}>
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`${styles.slide} ${slide.className} ${
                  index === activeIndex ? styles.activeSlide : ""
                }`}
              >
                <div className={styles.content}>
                  <div className={styles.badgeRow}>
                    {slide.badges.map((b, i) => (
                      <span
                        key={i}
                        className={`${styles.badge} ${
                          b.type === "green" ? styles.badgeGreen : styles.badgeOrange
                        }`}
                      >
                        {b.text}
                      </span>
                    ))}
                  </div>

                  <ul className={styles.titleList}>
                    {slide.bulletPoints.map((point, i) => (
                      <li key={i} className={styles.titleItem}>
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className={styles.slideSubtitle}>{slide.subtitle}</div>
                </div>

                <div className={styles.graphicContainer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {slide.image && (
                    <img
                      src={slide.image}
                      alt={slide.subtitle}
                      className={styles.mockupImage}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className={`${styles.arrowBtn} ${styles.prevBtn}`}
                aria-label="Previous Slide"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className={`${styles.arrowBtn} ${styles.nextBtn}`}
                aria-label="Next Slide"
              >
                <ChevronRight size={24} />
              </button>

              <div className={styles.indicators}>
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`${styles.dot} ${
                      index === activeIndex ? styles.activeDot : ""
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {sideBanner && (
        <a href={sideBanner.link_url || "#"} className={styles.sideBanner}>
          <div className={styles.sideBannerContent}>
            <span className={styles.sideBadge}>{sideBanner.badge_text || "PROMO"}</span>
            <h3 className={styles.sideTitle}>{sideBanner.title || "Diskon Spesial"}</h3>
            <p className={styles.sideDesc}>{sideBanner.description || "Dapatkan penawaran menarik!"}</p>
            <div className={styles.sideBtn}>{sideBanner.button_text || "Beli Sekarang"}</div>
          </div>
        </a>
      )}
    </section>
  );
};
