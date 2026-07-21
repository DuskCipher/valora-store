"use client";

import React from "react";
import Link from "next/link";
import { Search, MessageSquare, ShoppingCart, User, ChevronDown, Bell, Store } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { CartDrawer } from "./CartDrawer";
import { ProfileDropdown } from "./ProfileDropdown";
import { NotificationDropdown } from "./NotificationDropdown";
import { AuthModal } from "./AuthModal";
import { ValoraLogo } from "./ValoraLogo";
import { useTheme } from "@/context/ThemeContext";
import { Home, Compass, Grid, MessageCircle, X, HelpCircle, Moon, Sun, Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const { searchTerm, setSearchTerm, totalCartItems } = useStore();
  const { isLoggedIn, user, supabaseUser, login, logout, hasStore } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);

  const [unreadMsgCount, setUnreadMsgCount] = React.useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = React.useState(0);

  const pathname = usePathname();
  const router = useRouter();

  // Load supabase client dynamically or import
  const { supabase } = require("@/lib/supabase");

  React.useEffect(() => {
    if (!isLoggedIn || !supabaseUser) {
      setUnreadNotifCount(0);
      setUnreadMsgCount(0);
      return;
    }

    const fetchCounts = async () => {
      try {
        // Fetch unread notifications
        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', supabaseUser.id)
          .eq('is_read', false);

        setUnreadNotifCount(notifCount || 0);

        // Fetch unread messages
        // First find rooms where the user is a buyer
        const { data: rooms } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('buyer_id', supabaseUser.id);
          
        const roomIds = rooms?.map((r: any) => r.id) || [];
        
        // Also find rooms where the user is the owner of the store
        const { data: myStore } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', supabaseUser.id)
          .maybeSingle();

        if (myStore) {
          const { data: storeRooms } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('store_id', myStore.id);
            
          if (storeRooms) {
            storeRooms.forEach((r: any) => {
              if (!roomIds.includes(r.id)) roomIds.push(r.id);
            });
          }
        }

        if (roomIds.length > 0) {
          const { count: msgCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .in('room_id', roomIds)
            .neq('sender_id', supabaseUser.id)
            .eq('is_read', false);

          setUnreadMsgCount(msgCount || 0);
        } else {
          setUnreadMsgCount(0);
        }
      } catch (err) {
        console.error("Error fetching counts:", err);
      }
    };

    fetchCounts();

    // Subscribe to new messages & notifications
    const channelName = `header-unread-counts-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelName);
    
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${supabaseUser.id}` }, () => {
      fetchCounts();
    });
    
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
      fetchCounts();
    });
    
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, supabaseUser]);
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      router.push(`/products`);
      setIsMobileSearchOpen(false); // Close mobile search row if open
    }
  };

  const isDashboardArea = pathname?.startsWith('/dashboard') || 
                          pathname?.startsWith('/payment-history') ||
                          pathname?.startsWith('/pembelian') ||
                          pathname?.startsWith('/wishlist') ||
                          pathname?.startsWith('/deposit') ||
                          pathname?.startsWith('/mutasi-saldo') ||
                          pathname?.startsWith('/afiliasi') ||
                          pathname?.startsWith('/penarikan') ||
                          pathname?.startsWith('/profile-settings') ||
                          pathname?.startsWith('/security');

  const handleProfileClick = () => {
    if (isLoggedIn) {
      setIsProfileOpen(!isProfileOpen);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <header className={styles.header}>
      {/* Top Bar info */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link href="/contact-us" className={styles.topLink}>Hubungi Kami</Link>
          <a href="mailto:admin@valora.com" className={styles.topLink}>admin@valora.com</a>
          <Link href="/blog" className={styles.topLink}>Artikel</Link>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.langSwitch}>
            <img src="https://flagcdn.com/w20/id.png" alt="ID" width={16} height={12} style={{borderRadius: '2px'}} />
            <span className={styles.activeLang}>Indonesia</span>
          </div>
          <div className={styles.langSwitch}>
            <img src="https://flagcdn.com/w20/gb.png" alt="EN" width={16} height={12} style={{borderRadius: '2px'}} />
            <span>English</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className={styles.mainNav}>
        {/* Logo */}
        <Link href="/" className={styles.logo} onClick={() => setSearchTerm("")}>
          <ValoraLogo size={24} isDark={theme === "dark"} />
          <span style={{ marginLeft: "8px" }}>Valora Store_</span>
        </Link>

        {/* Search input (Desktop) */}
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari sesuatu..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        {/* Action icons / CTA */}
        <div className={`${styles.navActions} ${styles.desktopOnly}`}>
          <Link href="/products" className={styles.exploreBtn} style={{ textDecoration: 'none' }}>
            Jelajahi Produk <ChevronDown size={16} />
          </Link>

          {isLoggedIn && (
            <div style={{ position: "relative" }}>
              <button 
                className={styles.iconBtn} 
                aria-label="Notifications"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <Bell size={20} />
                {unreadNotifCount > 0 && (
                  <span className={styles.badge}>{unreadNotifCount}</span>
                )}
              </button>
              <NotificationDropdown 
                isOpen={isNotifOpen} 
                onClose={() => setIsNotifOpen(false)} 
              />
            </div>
          )}

          {isLoggedIn ? (
            <Link href="/chat" className={`${styles.iconBtn} ${styles.desktopOnly}`} aria-label="Messages" style={{ textDecoration: 'none' }}>
              <MessageSquare size={20} />
              {unreadMsgCount > 0 && (
                <span className={`${styles.badge} ${styles.badgeDanger}`}>{unreadMsgCount}</span>
              )}
            </Link>
          ) : (
            <button className={`${styles.iconBtn} ${styles.desktopOnly}`} aria-label="Messages" onClick={() => setIsAuthModalOpen(true)}>
              <MessageSquare size={20} />
            </button>
          )}


          <button className={styles.iconBtn} aria-label="Cart" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={20} />
            {totalCartItems > 0 && (
              <span className={styles.badge}>{totalCartItems}</span>
            )}
          </button>

          {isLoggedIn ? (
            <>
              {hasStore ? (
                <Link href="/shop/dashboard" className={styles.myStoreBtn}>
                  <Store size={16} />
                  Toko Saya
                </Link>
              ) : (
                <Link href="/shop/pengaturan/informasi" className={styles.startSellingBtn}>
                  <Store size={16} />
                  Mulai Berjualan
                </Link>
              )}
              <div className={styles.profileContainer}>
                <button className={styles.profileBtnLoggedIn} aria-label="Profile" onClick={handleProfileClick}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span className={styles.profileAvatar}>{user?.avatarFallback || "U"}</span>
                  )}
                </button>
                <ProfileDropdown
                  isOpen={isProfileOpen}
                  onClose={() => setIsProfileOpen(false)}
                  onLogout={logout}
                />
              </div>
            </>
          ) : (
            <>
              <button className={styles.sellerBtn} onClick={() => setIsAuthModalOpen(true)}>
                Jadi penjual
              </button>
              <button className={styles.profileBtn} aria-label="Profile" onClick={handleProfileClick}>
                <User size={18} />
              </button>
            </>
          )}
        </div>
        
        {/* Mobile Search Icon (Only visible on mobile) */}
        <div className={styles.mobileOnly} style={{ display: "none", alignItems: "center", gap: 12 }}>
          <button 
            className={styles.iconBtn} 
            aria-label="Search" 
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            style={{ 
              backgroundColor: isMobileSearchOpen ? "var(--bg-input)" : "transparent",
              color: isMobileSearchOpen ? "var(--primary)" : "var(--text-main)"
            }}
          >
            <Search size={20} />
          </button>
          
          {isLoggedIn ? (
            <>
              <div style={{ height: "24px", width: "1px", backgroundColor: "var(--border-color)", margin: "0 2px" }}></div>
              
              <div style={{ position: "relative" }}>
                <button 
                  className={styles.iconBtn} 
                  aria-label="Notifications"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  style={{ width: "32px", height: "32px" }}
                >
                  <Bell size={18} />
                  {unreadNotifCount > 0 && (
                    <span className={styles.badge} style={{ top: '-2px', right: '-2px', fontSize: '9px', minWidth: '14px', height: '14px', lineHeight: '14px' }}>{unreadNotifCount}</span>
                  )}
                </button>
                <NotificationDropdown 
                  isOpen={isNotifOpen} 
                  onClose={() => setIsNotifOpen(false)} 
                />
              </div>

              {/* Message icon removed from mobile header as requested */}

              <Link href={hasStore ? "/shop/dashboard" : "/shop/pengaturan/informasi"} className={styles.iconBtn} style={{ width: "32px", height: "32px" }}>
                <Store size={18} />
              </Link>

              <div className={styles.profileContainer}>
                <button className={styles.profileBtnLoggedIn} aria-label="Profile" onClick={handleProfileClick} style={{ width: "32px", height: "32px" }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span className={styles.profileAvatar}>{user?.avatarFallback || "U"}</span>
                  )}
                </button>
                <ProfileDropdown
                  isOpen={isProfileOpen}
                  onClose={() => setIsProfileOpen(false)}
                  onLogout={logout}
                />
              </div>
            </>
          ) : (
            <button className={styles.profileBtn} aria-label="Profile" onClick={handleProfileClick}>
              <User size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Row */}
      {isMobileSearchOpen && (
        <div className={styles.mobileSearchRow}>
          <div className={styles.mobileSearchContainer}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Cari sesuatu..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {!isDashboardArea && (
        <div className={styles.bottomNav}>
          <Link href="/" className={`${styles.bottomNavItem} ${styles.active}`} onClick={() => setSearchTerm("")}>
            <Home size={20} />
          </Link>
          <Link href="/chat" className={styles.bottomNavItem}>
            <MessageCircle size={20} />
          </Link>
          <button className={styles.bottomNavItem} onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={20} />
            {totalCartItems > 0 && (
              <span className={styles.bottomNavBadge}>{totalCartItems}</span>
            )}
          </button>
          <button className={styles.bottomNavItem} onClick={() => setIsMobileSidebarOpen(true)}>
            <Menu size={20} />
          </button>
        </div>
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`${styles.mobileSidebarOverlay} ${isMobileSidebarOpen ? styles.open : ""}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      ></div>
      <div className={`${styles.mobileSidebar} ${isMobileSidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo} onClick={() => { setIsMobileSidebarOpen(false); setSearchTerm(""); }}>
            <ValoraLogo size={24} isDark={theme === "dark"} />
            <span style={{ marginLeft: "8px" }}>Valora Store_</span>
          </Link>
          <button className={styles.sidebarClose} onClick={() => setIsMobileSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className={styles.sidebarMenu}>
          <Link href="/" className={styles.sidebarItem} onClick={() => { setIsMobileSidebarOpen(false); setSearchTerm(""); }}>
            <div className={styles.left}><Home size={18} /> Home</div>
          </Link>
          <Link 
            href="/products"
            className={styles.sidebarItem} 
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div className={styles.left}><Compass size={18} /> Explore</div>
          </Link>
          <Link 
            href="/products" 
            className={styles.sidebarItem} 
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div className={styles.left}><Grid size={18} /> Categories</div>
          </Link>
          <Link 
            href="#" 
            className={styles.sidebarItem} 
            onClick={(e) => {
              e.preventDefault();
              alert("Fitur SMM Panel sedang dalam pengembangan.");
            }}
            style={{ justifyContent: 'space-between' }}
          >
            <div className={styles.left}><MessageSquare size={18} /> SMM Panel</div>
            <span style={{ fontSize: '10px', backgroundColor: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Coming Soon</span>
          </Link>
        </div>
        
        <div className={styles.sidebarFooter}>
          <Link href="/contact-us" className={styles.sidebarItem} style={{ padding: "8px 0" }} onClick={() => setIsMobileSidebarOpen(false)}>
            <div className={styles.left}><HelpCircle size={18} /> Contact</div>
          </Link>
          <Link href="/shop/dashboard" className={styles.sidebarItem} style={{ padding: "8px 0" }} onClick={() => setIsMobileSidebarOpen(false)}>
            <div className={styles.left}><Store size={18} /> Shop Area</div>
          </Link>
          
          <div className={styles.themeToggle} onClick={toggleTheme} style={{ cursor: 'pointer', padding: "8px 0", display: "flex", alignItems: "center", gap: "12px", color: "var(--text-main)" }}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>Switch theme</span>
          </div>
          
          <div className={styles.copyright}>
            © Copyright 2026 PT VALORA NUSANTARA TECHWORK 2.1.
          </div>
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={login} />
    </header>
  );
};
