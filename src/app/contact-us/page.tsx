"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MapPin, Phone, Mail } from "lucide-react";
import styles from "./page.module.css";

export default function ContactUsPage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)", display: "flex", flexDirection: "column" }}>
      <Header />
      
      <div style={{ flex: 1 }}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Butuh Bantuan Atau Punya Pertanyaan?</h1>
            <p className={styles.subtitle}>Berikan Informasi Kontak Anda dan kami akan segera menghubungi Anda.</p>
          </div>
          
          <div className={styles.card}>
            {/* Left Column */}
            <div className={styles.infoColumn}>
              <h2 className={styles.infoTitle}>Informasi Kontak</h2>
              <p className={styles.infoDesc}>
                Isi formulir dan tim kami akan segera menghubungi Anda.
              </p>
              
              <div className={styles.contactItem}>
                <div className={styles.iconWrapper}>
                  <MapPin size={20} />
                </div>
                <div>
                  <span className={styles.contactLabel}>Alamat</span>
                  <span className={styles.contactValue}>
                    Purwokerto, Jawa Tengah,<br />Indonesia
                  </span>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <div className={styles.iconWrapper}>
                  <Phone size={20} />
                </div>
                <div>
                  <span className={styles.contactLabel}>Telepon</span>
                  <span className={styles.contactValue}>
                    085600685685
                  </span>
                </div>
              </div>
              
              <div className={styles.contactItem}>
                <div className={styles.iconWrapper}>
                  <Mail size={20} />
                </div>
                <div>
                  <span className={styles.contactLabel}>Email</span>
                  <span className={styles.contactValue}>
                    admin@valora.com
                  </span>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className={styles.formColumn}>
              <form onSubmit={(e) => { e.preventDefault(); alert("Pesan telah terkirim!"); }}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nama</label>
                    <input type="text" className={styles.input} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email</label>
                    <input type="email" className={styles.input} required />
                  </div>
                </div>
                
                <div className={styles.formGroup} style={{ marginBottom: "24px" }}>
                  <label className={styles.label}>Subjek</label>
                  <input type="text" className={styles.input} required />
                </div>
                
                <div className={styles.formGroup} style={{ marginBottom: "32px" }}>
                  <label className={styles.label}>Pesan</label>
                  <textarea className={styles.textarea} required></textarea>
                </div>
                
                <button type="submit" className={styles.submitBtn}>
                  Hubungi Kami
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
