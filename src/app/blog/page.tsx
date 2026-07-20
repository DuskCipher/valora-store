"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import styles from "./page.module.css";
import Link from "next/link";

const DUMMY_POSTS = [
  {
    id: 1,
    title: "Memaksimalkan Potensi Produk Anda dengan Marketplace Produk Digital",
    excerpt: "Pasar digital telah menjadi kekuatan yang tak terbendung dalam dekade terakhir, mengubah cara Anda memasarkan dan menjual produk. Dengan pertumbuhan eksponensial e-commerce dan platform online, memanfaatkan media pasar digital bukan lagi pilihan, melainkan keharusan.",
    category: "BISNIS",
    date: "Mar 29, 2024",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
    author: {
      name: "Ilman S - Administrator",
      avatar: "https://ui-avatars.com/api/?name=Ilman+S&background=0D8ABC&color=fff"
    }
  },
  {
    id: 2,
    title: "Mengoptimalkan Penggunaan AI dalam Pengembangan Produk Digital Anda",
    excerpt: "Dalam dunia yang terus bergerak menuju digitalisasi, kecerdasan buatan (AI) telah menjadi katalis yang mengubah cara kita mengembangkan produk. Anda yang bergerak di bidang pengembangan produk digital mungkin telah menyadari betapa pentingnya AI, tetapi...",
    category: "TEKNOLOGI",
    date: "Mar 29, 2024",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80",
    author: {
      name: "Ilman S - Administrator",
      avatar: "https://ui-avatars.com/api/?name=Ilman+S&background=0D8ABC&color=fff"
    }
  }
];

export default function BlogPage() {
  return (
    <main style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      <Header />
      
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.headerArea}>
          <h1 className={styles.mainTitle}>
            <strong>This is ValoraBlog.</strong> A blog that covers productivity, tips, tech, update, and strategies for massive profits.
          </h1>
        </div>

        {/* Featured Posts */}
        <div style={{ marginBottom: "40px" }}>
          <h2 className={styles.sectionTitle}>Featured Posts</h2>
          
          <div className={styles.featuredGrid}>
            {DUMMY_POSTS.map((post, idx) => (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.imageWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.image} alt={post.title} />
                </div>
                
                <div className={styles.postMeta}>
                  <span className={styles.categoryBadge}>{post.category}</span>
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
                
                <Link href="#" style={{ textDecoration: 'none' }}>
                  <h3 className={styles.postTitle} style={{ fontSize: idx === 0 ? "28px" : "22px" }}>
                    {post.title}
                  </h3>
                </Link>
                
                <p className={styles.postExcerpt}>{post.excerpt}</p>
                
                <div className={styles.authorInfo}>
                  <img src={post.author.avatar} alt={post.author.name} className={styles.authorAvatar} />
                  <span className={styles.authorName}>{post.author.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
      
      <Footer />
    </main>
  );
}
