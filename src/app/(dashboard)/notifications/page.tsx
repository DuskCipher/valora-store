"use client";

import React, { useState, useEffect } from "react";
import { Bell, Info, ShoppingBag, CreditCard, Settings, MessageSquare, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'info' | 'order' | 'payment' | 'system' | 'chat';
  is_read: boolean;
  target_url?: string;
  scope: 'user' | 'shop';
  created_at: string;
}

export default function NotificationsPage() {
  const { isLoggedIn, supabaseUser } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!supabaseUser) return;
    setIsLoading(true);
    setDbError(null);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .order('created_at', { ascending: false });

      if (activeFilter !== "all") {
        query = query.eq('type', activeFilter);
      }

      const { data, error } = await query;

      if (error) {
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          setDbError("Database notifikasi belum dikonfigurasi. Harap jalankan file 'supabase_schema.sql' di SQL Editor Supabase Anda untuk mengaktifkan fitur ini.");
        } else {
          setDbError(error.message);
        }
        setNotifications([]);
      } else {
        setNotifications(data || []);
      }
    } catch (err: any) {
      console.error(err);
      setDbError("Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!supabaseUser) return;
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase.channel(`page-notifs-${supabaseUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${supabaseUser.id}` },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseUser, activeFilter]);

  const markAllAsRead = async () => {
    if (!supabaseUser) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', supabaseUser.id);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string, targetUrl?: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      
      if (targetUrl) {
        router.push(targetUrl);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <div className={`${styles.icon} ${styles.iconOrder}`}><ShoppingBag size={18} /></div>;
      case "payment":
        return <div className={`${styles.icon} ${styles.iconPayment}`}><CreditCard size={18} /></div>;
      case "system":
        return <div className={`${styles.icon} ${styles.iconSystem}`}><Settings size={18} /></div>;
      case "chat":
        return <div className={`${styles.icon} ${styles.iconChat}`}><MessageSquare size={18} /></div>;
      case "info":
      default:
        return <div className={`${styles.icon} ${styles.iconInfo}`}><Info size={18} /></div>;
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Baru saja";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Kemarin";
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notifikasi</h1>
        {!dbError && notifications.length > 0 && (
          <button className={styles.markAllBtn} onClick={markAllAsRead}>
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeFilter === "all" ? styles.activeTab : ""}`} onClick={() => setActiveFilter("all")}>Semua</button>
        <button className={`${styles.tab} ${activeFilter === "info" ? styles.activeTab : ""}`} onClick={() => setActiveFilter("info")}>Informasi</button>
        <button className={`${styles.tab} ${activeFilter === "order" ? styles.activeTab : ""}`} onClick={() => setActiveFilter("order")}>Pesanan</button>
        <button className={`${styles.tab} ${activeFilter === "payment" ? styles.activeTab : ""}`} onClick={() => setActiveFilter("payment")}>Pembayaran</button>
        <button className={`${styles.tab} ${activeFilter === "system" ? styles.activeTab : ""}`} onClick={() => setActiveFilter("system")}>Sistem</button>
        <button className={`${styles.tab} ${activeFilter === "chat" ? styles.activeTab : ""}`} onClick={() => setActiveFilter("chat")}>Obrolan</button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Memuat notifikasi...
        </div>
      ) : dbError ? (
        <div className={styles.emptyState} style={{ borderColor: '#ef4444' }}>
          <AlertCircle size={40} color="#ef4444" className={styles.emptyIcon} />
          <p className={styles.emptyText} style={{ color: '#ef4444', marginBottom: '8px' }}>Gagal Memuat Notifikasi</p>
          <p style={{ margin: 0, fontSize: '13px' }}>{dbError}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <Bell size={40} color="var(--text-muted)" className={styles.emptyIcon} />
          <p className={styles.emptyText}>Tidak ada notifikasi dalam kategori ini</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`${styles.card} ${!notif.is_read ? styles.unreadCard : ""}`}
              onClick={() => markAsRead(notif.id, notif.target_url)}
            >
              {getIcon(notif.type)}
              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{notif.title}</h3>
                <p className={styles.cardContent}>{notif.content}</p>
                <span className={styles.cardTime}>{timeAgo(notif.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
