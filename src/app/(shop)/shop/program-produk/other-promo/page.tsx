"use client";

import React from "react";
import { Sparkles, Construction } from "lucide-react";

export default function OtherPromoPage() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "80vh",
      padding: "24px",
      textAlign: "center"
    }}>
      <div style={{
        backgroundColor: "var(--bg-card, #ffffff)",
        padding: "48px 32px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        maxWidth: "500px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px"
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: "rgba(0, 193, 101, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--brand-primary, #00c165)",
          marginBottom: "8px"
        }}>
          <Sparkles size={40} strokeWidth={1.5} />
        </div>
        
        <h1 style={{ 
          fontSize: "24px", 
          fontWeight: "700", 
          color: "var(--text-main)",
          margin: 0
        }}>
          Other Promo
        </h1>
        
        <p style={{ 
          fontSize: "16px", 
          color: "var(--text-muted)",
          lineHeight: "1.5",
          margin: 0
        }}>
          Fitur ini akan segera datang! Kami sedang mempersiapkan program promosi menarik lainnya untuk meningkatkan penjualan toko Anda.
        </p>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          backgroundColor: "var(--bg-body, #f8f9fa)",
          borderRadius: "8px",
          marginTop: "16px",
          color: "var(--text-main)",
          fontSize: "14px",
          fontWeight: "500"
        }}>
          <Construction size={18} />
          Dalam Pengembangan
        </div>
      </div>
    </div>
  );
}
