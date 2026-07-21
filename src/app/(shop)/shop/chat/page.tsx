"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { MessageSquare, ArrowLeft, Send, AlertCircle } from "lucide-react";
import styles from "@/app/chat/page.module.css";

interface BuyerProfile {
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

interface ChatRoom {
  id: string;
  buyer_id: string;
  store_id: string;
  created_at: string;
  updated_at: string;
  buyer?: BuyerProfile;
  unreadCount?: number;
  lastMessage?: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

function SellerChatContent() {
  const { isLoggedIn, supabaseUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeRoomIdParam = searchParams.get("room");

  const [storeId, setStoreId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn && !supabaseUser) {
      router.push("/login");
    }
  }, [isLoggedIn, supabaseUser, router]);

  // Fetch the seller's store ID
  useEffect(() => {
    const getStore = async () => {
      if (!supabaseUser) return;
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', supabaseUser.id)
          .maybeSingle();

        if (error) {
          console.error(error);
        } else if (data) {
          setStoreId(data.id);
        } else {
          setDbError("Anda harus memiliki toko untuk mengakses chat pembeli. Silakan buat toko terlebih dahulu.");
          setIsLoadingRooms(false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getStore();
  }, [supabaseUser]);

  // Fetch all chat rooms for this store
  const fetchRooms = async () => {
    if (!storeId || !supabaseUser) return;
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('store_id', storeId)
        .order('updated_at', { ascending: false });

      if (error) {
        if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
          setDbError("Database chat belum dikonfigurasi. Harap jalankan file 'supabase_schema.sql' di SQL Editor Supabase Anda.");
        } else {
          setDbError(error.message);
        }
        setRooms([]);
      } else {
        const roomsWithMeta = await Promise.all((data || []).map(async (room: any) => {
          // Fetch buyer profile manually to handle relational errors gracefully
          let buyerProfile: BuyerProfile = {};
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, email')
              .eq('id', room.buyer_id)
              .maybeSingle();
            if (profile) {
              buyerProfile = profile;
            }
          } catch (e) {
            console.error("Error fetching profile for room:", room.id, e);
          }

          // Fetch last message
          const { data: msgData } = await supabase
            .from('chat_messages')
            .select('message, created_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Fetch unread count for received messages
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .neq('sender_id', supabaseUser.id)
            .eq('is_read', false);

          return {
            ...room,
            buyer: buyerProfile,
            lastMessage: msgData?.message || "Belum ada pesan",
            unreadCount: count || 0
          };
        }));

        setRooms(roomsWithMeta);
        
        // Auto-select room from query param
        if (activeRoomIdParam) {
          const selected = roomsWithMeta.find(r => r.id === activeRoomIdParam);
          if (selected) {
            setActiveRoom(selected);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setDbError("Gagal memuat percakapan pembeli.");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (!storeId || !supabaseUser) return;
    fetchRooms();

    // Subscribe to new rooms and updates
    const roomChannelName = `seller-rooms-${storeId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const roomChannel = supabase.channel(roomChannelName);
    
    roomChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms', filter: `store_id=eq.${storeId}` }, () => {
      fetchRooms();
    });
    
    roomChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
      fetchRooms();
    });
    
    roomChannel.subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [storeId, supabaseUser, activeRoomIdParam]);

  // Fetch messages in selected room
  const fetchMessages = async (roomId: string) => {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        // Mark as read
        await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .eq('room_id', roomId)
          .neq('sender_id', supabaseUser?.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!activeRoom) return;
    fetchMessages(activeRoom.id);

    // Subscribe to new messages in active room
    const messageChannelName = `seller-room-msgs-${activeRoom.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const messageChannel = supabase.channel(messageChannelName);
    
    messageChannel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoom.id}` },
      (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        
        // Mark as read if not sent by me
        if (newMsg.sender_id !== supabaseUser?.id) {
          supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('id', newMsg.id).then();
        }
      }
    );
    
    messageChannel.subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [activeRoom, supabaseUser]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoom || !supabaseUser || isSending) return;
    
    setIsSending(true);
    const msgText = inputText;
    setInputText("");
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: activeRoom.id,
          sender_id: supabaseUser.id,
          message: msgText
        });

      if (error) throw error;
      
      // Local state update for instant feedback
      setRooms(prev => {
        const idx = prev.findIndex(r => r.id === activeRoom.id);
        if (idx === -1) return prev;
        const updated = { ...prev[idx], lastMessage: msgText, updated_at: new Date().toISOString() };
        const next = [...prev];
        next.splice(idx, 1);
        return [updated, ...next];
      });

    } catch (err: any) {
      alert("Gagal mengirim pesan: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setActiveRoom(room);
    router.replace(`/shop/chat?room=${room.id}`);
  };

  const handleBackToRooms = () => {
    setActiveRoom(null);
    router.replace('/shop/chat');
  };

  const getBuyerName = (room: ChatRoom) => {
    if (room.buyer?.full_name && room.buyer.full_name.trim() !== "") {
      return room.buyer.full_name;
    }
    if (room.buyer?.email) {
      return room.buyer.email.split("@")[0];
    }
    return "Pembeli";
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container} style={{ padding: 0 }}>
      {dbError ? (
        <div className={styles.dbAlert}>
          <AlertCircle size={48} color="#ef4444" />
          <h2 className={styles.dbAlertTitle}>Konfigurasi Dibutuhkan</h2>
          <p className={styles.dbAlertText}>{dbError}</p>
          <button 
            className={styles.dbAlertBtn}
            onClick={() => router.push('/supabase_schema.sql')}
          >
            Unduh SQL Script
          </button>
        </div>
      ) : (
        <div className={styles.chatWrapper} style={{ height: "calc(100vh - 120px)", maxHeight: "750px", border: "none", borderRadius: "8px" }}>
          {/* Rooms List Panel */}
          <div className={`${styles.roomsPanel} ${activeRoom ? styles.activeRoomsPanelHidden : ""}`}>
            <div className={styles.roomsHeader}>
              <h2 className={styles.roomsTitle}>Chat Pembeli</h2>
            </div>
            <div className={styles.roomsList}>
              {isLoadingRooms ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "13px" }}>
                  Memuat obrolan pembeli...
                </div>
              ) : rooms.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "13px" }}>
                  Belum ada pesan dari pembeli.
                </div>
              ) : (
                rooms.map(room => (
                  <div
                    key={room.id}
                    className={`${styles.roomItem} ${activeRoom?.id === room.id ? styles.activeRoomItem : ""}`}
                    onClick={() => handleSelectRoom(room)}
                  >
                    <div className={styles.roomAvatar}>
                      {room.buyer?.avatar_url ? (
                        <img src={room.buyer.avatar_url} alt={getBuyerName(room)} className={styles.roomAvatarImg} />
                      ) : (
                        getBuyerName(room).substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className={styles.roomInfo}>
                      <div className={styles.roomMeta}>
                        <h3 className={styles.roomName}>{getBuyerName(room)}</h3>
                        <span className={styles.roomTime}>
                          {new Date(room.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className={styles.roomLastMsgRow}>
                        <p className={styles.roomLastMsg}>{room.lastMessage}</p>
                        {room.unreadCount && room.unreadCount > 0 ? (
                          <span className={styles.unreadBadge}>{room.unreadCount}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Window Panel */}
          <div className={`${styles.messagesPanel} ${!activeRoom ? styles.messagesPanelHidden : ""}`}>
            {activeRoom ? (
              <>
                <div className={styles.chatHeader}>
                  <button className={styles.mobileBackBtn} onClick={handleBackToRooms} aria-label="Kembali ke daftar pesan">
                    <ArrowLeft size={20} />
                  </button>
                  <div className={styles.roomAvatar} style={{ width: "36px", height: "36px", fontSize: "13px" }}>
                    {activeRoom.buyer?.avatar_url ? (
                      <img src={activeRoom.buyer.avatar_url} alt={getBuyerName(activeRoom)} className={styles.roomAvatarImg} />
                    ) : (
                      getBuyerName(activeRoom).substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <h3 className={styles.chatHeaderName}>{getBuyerName(activeRoom)}</h3>
                </div>

                <div className={styles.chatBody}>
                  {isLoadingMessages ? (
                    <div style={{ margin: "auto", color: "var(--text-muted)", fontSize: "13px" }}>
                      Memuat obrolan...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ margin: "auto", color: "var(--text-muted)", fontSize: "13px" }}>
                      Belum ada pesan.
                    </div>
                  ) : (
                    messages.map(msg => {
                      const isSentByMe = msg.sender_id === supabaseUser?.id;
                      return (
                        <div 
                          key={msg.id} 
                          className={`${styles.messageRow} ${isSentByMe ? styles.sentRow : styles.receivedRow}`}
                        >
                          <div className={`${styles.messageBubble} ${isSentByMe ? styles.sentBubble : styles.receivedBubble}`}>
                            {msg.message}
                          </div>
                          <span className={styles.messageTime}>{formatMessageTime(msg.created_at)}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className={styles.chatFooter}>
                  <form className={styles.inputForm} onSubmit={handleSendMessage}>
                    <input
                      type="text"
                      placeholder="Tulis pesan..."
                      className={styles.input}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={isSending}
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!inputText.trim() || isSending}>
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className={styles.noActiveChat}>
                <MessageSquare size={48} />
                <p>Pilih percakapan pembeli untuk mulai berkirim pesan</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerChatPage() {
  return (
    <React.Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Memuat obrolan pembeli...</div>}>
      <SellerChatContent />
    </React.Suspense>
  );
}
