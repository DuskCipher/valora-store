import React, { useState, useEffect } from "react";
import { Bell, Info, ShoppingBag, CreditCard, Settings, MessageSquare, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./NotificationDropdown.module.css";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { isLoggedIn, supabaseUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"User" | "Shop">("User");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!isLoggedIn || !supabaseUser) return;
    setIsLoading(true);
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .eq('scope', activeTab.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          setDbError("Database belum dikonfigurasi. Harap jalankan schema SQL.");
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
    if (!isOpen) return;
    fetchNotifications();

    if (!supabaseUser) return;

    // Subscribe to new notifications
    const channelName = `dropdown-notifs-${supabaseUser.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName);
    
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${supabaseUser.id}` },
      () => {
        fetchNotifications();
      }
    );
    
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, activeTab, isLoggedIn, supabaseUser]);

  const markAllAsRead = async () => {
    if (!isLoggedIn || !supabaseUser) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', supabaseUser.id)
        .eq('scope', activeTab.toLowerCase());

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

      if (targetUrl) {
        router.push(targetUrl);
      }
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <div className={`${styles.itemIcon} ${styles.iconOrder}`}><ShoppingBag size={16} /></div>;
      case "payment":
        return <div className={`${styles.itemIcon} ${styles.iconPayment}`}><CreditCard size={16} /></div>;
      case "system":
        return <div className={`${styles.itemIcon} ${styles.iconSystem}`}><Settings size={16} /></div>;
      case "chat":
        return <div className={`${styles.itemIcon} ${styles.iconChat}`}><MessageSquare size={16} /></div>;
      case "info":
      default:
        return <div className={`${styles.itemIcon} ${styles.iconInfo}`}><Info size={16} /></div>;
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
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.dropdown}>
        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === "User" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("User")}
          >
            User
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "Shop" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("Shop")}
          >
            Toko
          </button>
        </div>

        {/* Content */}
        <div className={styles.content} style={{ display: 'block', padding: 0 }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Memuat notifikasi...
            </div>
          )}

          {dbError ? (
            <div className={styles.dbAlert}>
              <AlertCircle size={24} />
              <p style={{ margin: 0 }}>{dbError}</p>
              <button 
                className={styles.dbAlertBtn}
                onClick={() => router.push('/supabase_schema.sql')}
              >
                Lihat SQL Schema
              </button>
            </div>
          ) : !isLoading && notifications.length === 0 ? (
            <div className={styles.emptyState} style={{ minHeight: '200px' }}>
              <div className={styles.emptyIcon}>
                <Bell size={40} color="#cbd5e1" />
              </div>
              <p className={styles.emptyText}>Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className={styles.list}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`${styles.item} ${!notif.is_read ? styles.unreadItem : ""}`}
                  onClick={() => markAsRead(notif.id, notif.target_url)}
                >
                  {getIcon(notif.type)}
                  <div className={styles.itemBody}>
                    <p className={styles.itemTitle}>{notif.title}</p>
                    <p className={styles.itemContent}>{notif.content}</p>
                    <span className={styles.itemTime}>{timeAgo(notif.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Link href="/notifications" className={styles.footerBtnLeft} onClick={onClose} style={{ textDecoration: 'none' }}>
            Lihat semua
          </Link>
          {!dbError && notifications.length > 0 && (
            <button className={styles.footerBtnRight} onClick={markAllAsRead}>
              Tandai dibaca semua
            </button>
          )}
        </div>
      </div>
    </>
  );
};

