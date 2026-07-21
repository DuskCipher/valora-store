"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Users, ShoppingBag, Wallet, Store, Activity, TrendingUp } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';

type Transaction = { id: string, type: string, amount: number, created_at: string, status: string };
type StoreData = { id: string, status: string };

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isLoggedIn, supabaseUser } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalWithdrawals: 0,
  });

  const [salesData, setSalesData] = useState<any[]>([]);
  const [storeStatusData, setStoreStatusData] = useState<any[]>([]);
  const [txStatusData, setTxStatusData] = useState<any[]>([]);
  const [txTypeData, setTxTypeData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const isAuth = localStorage.getItem("zaystore_admin_auth");
    if (isAuth !== "true") {
      router.push("/admin/login");
      return;
    } 
    setIsAdmin(true);

    const fetchDashboardData = async () => {
      try {
        const [
          { count: usersCount },
          { data: stores },
          { data: txs }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('stores').select('status'),
          supabase.from('transactions').select('id, type, status, amount, created_at')
        ]);

        const totalUsers = usersCount || 0;
        const totalStores = stores?.length || 0;
        
        let totalOrders = 0;
        let totalRevenue = 0;
        let totalWithdrawals = 0;

        const txList = txs as Transaction[] || [];
        
        const last7Days = Array.from({length: 7}).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });
        
        const salesByDate: Record<string, number> = {};
        last7Days.forEach(date => salesByDate[date] = 0);

        txList.forEach(tx => {
          if (tx.type === 'order') {
            totalOrders++;
            totalRevenue += Number(tx.amount || 0);
            
            const dateOnly = new Date(tx.created_at).toISOString().split('T')[0];
            if (salesByDate[dateOnly] !== undefined) {
              salesByDate[dateOnly] += Number(tx.amount || 0);
            }
          } else if (tx.type === 'withdrawal' && tx.status === 'approved') {
            totalWithdrawals += Number(tx.amount || 0);
          }
        });

        let approved = 0, pending = 0, rejected = 0;
        stores?.forEach(s => {
          if (s.status === 'approved') approved++;
          else if (s.status === 'pending') pending++;
          else if (s.status === 'rejected') rejected++;
        });

        setStats({ totalUsers, totalStores, totalOrders, totalRevenue, totalWithdrawals });
        
        setSalesData(last7Days.map(date => ({
          name: date.slice(5),
          Pendapatan: salesByDate[date]
        })));

        setStoreStatusData([
          { name: 'Aktif', value: approved },
          { name: 'Menunggu', value: pending },
          { name: 'Ditolak', value: rejected }
        ]);

        // Transaction stats
        let successTx = 0, pendingTx = 0, failedTx = 0;
        let orderCount = 0, topupCount = 0, withdrawCount = 0;

        txList.forEach(tx => {
           // Status
           if (tx.status === 'success' || tx.status === 'approved' || tx.status === 'settlement') successTx++;
           else if (tx.status === 'pending') pendingTx++;
           else failedTx++;

           // Type
           if (tx.type === 'order') orderCount++;
           else if (tx.type === 'topup') topupCount++;
           else if (tx.type === 'withdrawal') withdrawCount++;
        });

        setTxStatusData([
           { name: 'Sukses', value: successTx },
           { name: 'Pending', value: pendingTx },
           { name: 'Gagal', value: failedTx }
        ]);

        setTxTypeData([
           { name: 'Order', value: orderCount },
           { name: 'Top Up', value: topupCount },
           { name: 'Penarikan', value: withdrawCount }
        ]);

        const sortedTxs = [...txList].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentTransactions(sortedTxs.slice(0, 6));

      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (isLoading) return <div style={{ padding: 40, color: "var(--text-main)" }}>Memuat data real-time...</div>;

  if (isAdmin === false) return null;

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24, color: "var(--text-main)" }}>Dashboard Utama</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
        
        <div style={{ flex: "1 1 200px", background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: 16, borderRadius: "50%", color: "var(--primary)" }}>
            <Wallet size={24} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 4 }}>Total Transaksi Belanja</p>
            <h3 style={{ fontSize: 20, fontWeight: "bold", color: "var(--text-main)" }}>Rp {stats.totalRevenue.toLocaleString('id-ID')}</h3>
          </div>
        </div>

        <div style={{ flex: "1 1 200px", background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: 16, borderRadius: "50%", color: "#3b82f6" }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 4 }}>Total Pesanan</p>
            <h3 style={{ fontSize: 24, fontWeight: "bold", color: "var(--text-main)" }}>{stats.totalOrders}</h3>
          </div>
        </div>

        <div style={{ flex: "1 1 200px", background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(139, 92, 246, 0.1)", padding: 16, borderRadius: "50%", color: "#8b5cf6" }}>
            <Store size={24} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 4 }}>Total Toko</p>
            <h3 style={{ fontSize: 24, fontWeight: "bold", color: "var(--text-main)" }}>{stats.totalStores}</h3>
          </div>
        </div>

        <div style={{ flex: "1 1 200px", background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: 16, borderRadius: "50%", color: "#f59e0b" }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 4 }}>Total Pengguna</p>
            <h3 style={{ fontSize: 24, fontWeight: "bold", color: "var(--text-main)" }}>{stats.totalUsers}</h3>
          </div>
        </div>

      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
        
        <div style={{ flex: "1 1 280px", background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: "var(--text-main)" }}>
            <TrendingUp size={20} /> Tren Pendapatan (7 Hari Terakhir)
          </h2>
          <div style={{ height: 300, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="Pendapatan" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.2} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(val) => `Rp ${val / 1000}k`} />
                <RechartsTooltip 
                  formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                  contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 8, color: "var(--text-main)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ flex: "1 1 280px", background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: "var(--text-main)" }}>
            <Activity size={20} /> Status Toko di Platform
          </h2>
          <div style={{ height: 300, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={storeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {storeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                   contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 8, color: "var(--text-main)" }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
        <div style={{ flex: "1 1 280px", background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: "var(--text-main)" }}>
            <Activity size={20} /> Distribusi Status Transaksi
          </h2>
          <div style={{ height: 300, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={txStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {txStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                   contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 8, color: "var(--text-main)" }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: "var(--text-main)" }}>
            <TrendingUp size={20} /> Tipe Transaksi
          </h2>
          <div style={{ height: 300, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={txTypeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.2} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border-color)", borderRadius: 8, color: "var(--text-main)" }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, border: "1px solid var(--border-color)", overflowX: "auto" }}>
        <h2 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: "var(--text-main)" }}>
          <ShoppingBag size={20} /> Transaksi Terbaru
        </h2>
        <table style={{ width: "100%", minWidth: "500px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
              <th style={{ padding: "12px", color: "var(--text-muted)", fontSize: 14 }}>ID Transaksi</th>
              <th style={{ padding: "12px", color: "var(--text-muted)", fontSize: 14 }}>Tipe</th>
              <th style={{ padding: "12px", color: "var(--text-muted)", fontSize: 14 }}>Nominal</th>
              <th style={{ padding: "12px", color: "var(--text-muted)", fontSize: 14 }}>Status</th>
              <th style={{ padding: "12px", color: "var(--text-muted)", fontSize: 14 }}>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "12px", fontSize: 14, color: "var(--text-main)" }}>{tx.id.split('-')[0]}...</td>
                <td style={{ padding: "12px", fontSize: 14, color: "var(--text-main)", textTransform: "capitalize" }}>{tx.type}</td>
                <td style={{ padding: "12px", fontSize: 14, fontWeight: "bold", color: "var(--primary)" }}>
                  Rp {tx.amount.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "4px 8px", borderRadius: "4px", fontSize: 12, fontWeight: "bold",
                    backgroundColor: (tx.status === 'success' || tx.status === 'approved' || tx.status === 'settlement') ? "rgba(16, 185, 129, 0.1)" : (tx.status === 'pending' ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)"),
                    color: (tx.status === 'success' || tx.status === 'approved' || tx.status === 'settlement') ? "#10b981" : (tx.status === 'pending' ? "#f59e0b" : "#ef4444")
                  }}>
                    {tx.status}
                  </span>
                </td>
                <td style={{ padding: "12px", fontSize: 14, color: "var(--text-muted)" }}>
                  {new Date(tx.created_at).toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
            {recentTransactions.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                  Belum ada transaksi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </div>
  );
}
