"use client";

import React from "react";
import { MapPin, Phone, AtSign } from "lucide-react";
import styles from "./page.module.css";
import { Header } from "@/components/Header";

export default function ContactUsPage() {
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.title}>Butuh Bantuan Atau Punya Pertanyaan?</h1>
          <p className={styles.subtitle}>
            Berikan Informasi Kontak Anda dan kami akan segera menghubungi Anda.
          </p>
        </div>

        <div className={styles.card}>
          {/* Left Column */}
          <div className={styles.leftCol}>
            <h2 className={styles.infoTitle}>Informasi Kontak</h2>
            <p className={styles.infoDesc}>
              Isi formulir dan tim kami akan segera menghubungi Anda.
            </p>

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.iconWrapper}>
                  <MapPin size={20} />
                </div>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Alamat</span>
                  <span className={styles.infoValue}>
                    Jl. leuwiliang, Bogor, Jawa Barat,<br />
                    Indonesia
                  </span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.iconWrapper}>
                  <Phone size={20} />
                </div>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Telepon</span>
                  <span className={styles.infoValue}>6282298859671</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.iconWrapper}>
                  <AtSign size={20} />
                </div>
                <div className={styles.infoText}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>admin@valora.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightCol}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nama</label>
                  <input type="text" className={styles.formInput} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input type="email" className={styles.formInput} />
                </div>
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Subjek</label>
                <input type="text" className={styles.formInput} />
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Pesan</label>
                <textarea className={styles.formTextarea}></textarea>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Hubungi Kami
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
