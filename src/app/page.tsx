"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, RefreshCw, CheckCircle2, TrendingUp, Plus, Wallet, Scissors, Users, ArrowRight, Hash, Calendar, CircleDollarSign, User, FileText } from "lucide-react";

type DashboardData = {
  totalPesanan: number;
  pesananAktif: number;
  pesananLunas: number;
  totalPendapatan: number;
  totalPiutang?: number;
  totalModal?: number;
  profit?: number;
  totalUsers: number;
  recentPembayaran: { id_bayar: number; nominal: number; tanggal: string }[];
  user: { name: string; role: string };
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then((res) => res.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" suppressHydrationWarning>
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" suppressHydrationWarning />
      </div>
    );
  }

  if (!data) return null;
  if ('error' in data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-red-500 font-medium">
        Error memuat dashboard: {String(data.error)}
      </div>
    );
  }

  const isAdmin = data.user.role === "ADMIN";

  const stats = [
    { label: "Total Pesanan", value: data.totalPesanan, icon: Package, bg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Pesanan Aktif", value: data.pesananAktif, icon: RefreshCw, bg: "bg-amber-50", iconColor: "text-amber-600" },
    { label: "Pesanan Lunas", value: data.pesananLunas, icon: CheckCircle2, bg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: isAdmin ? "Uang Masuk (Bersih)" : "Sisa Saldo Komisi", value: `Rp ${data.totalPendapatan.toLocaleString("id-ID")}`, icon: TrendingUp, bg: "bg-violet-50", iconColor: "text-violet-600" },
    ...(isAdmin ? [
      { label: "Total Modal", value: `Rp ${(data.totalModal || 0).toLocaleString("id-ID")}`, icon: CircleDollarSign, bg: "bg-rose-50", iconColor: "text-rose-600" },
      { label: "Ekspektasi Saldo", value: `Rp ${(data.totalPiutang || 0).toLocaleString("id-ID")}`, icon: Wallet, bg: "bg-cyan-50", iconColor: "text-cyan-600" },
      { label: "Untung", value: `Rp ${(data.profit || 0).toLocaleString("id-ID")}`, icon: TrendingUp, bg: "bg-green-50", iconColor: "text-green-600" },
    ] : []),
  ];

  const role = data.user.role;
  const isSales = role === "SALES";
  const isNego = role === "NEGO";
  const isPenagih = role === "PENAGIH";

  const quickActions = [
    ...(isAdmin ? [
      { label: "Laporan", href: "/laporan", icon: FileText, desc: "Rincian laporan kas" },
      { label: "Data Klien", href: "/klien", icon: Users, desc: "Kelola master klien" },
      { label: "Data Barang", href: "/barang", icon: Package, desc: "Kelola master barang" },
      { label: "Tambah Pesanan", href: "/pesanan", icon: Package, desc: "Buat pesanan baru" },
      { label: "Input Penagihan", href: "/pembayaran", icon: Wallet, desc: "Input setoran masuk" },
      { label: "Kelola Users", href: "/users", icon: Users, desc: "Tambah / edit pengguna" }
    ] : []),
    ...(isSales || isNego ? [
      { label: "Daftar Pesanan", href: "/pesanan", icon: Package, desc: "Lihat pesanan Anda" },
    ] : []),
    ...(isPenagih ? [
      { label: "Daftar Penagihan", href: "/pembayaran", icon: Wallet, desc: "Lihat penagihan Anda" },
    ] : []),
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Halo, {data.user.name} 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pantau ringkasan performa hari ini.</p>
        </div>
        <div className="mt-2 md:mt-0 px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg shadow-sm text-blue-700 text-xs font-semibold flex items-center space-x-1.5 w-max">
          <User className="w-3.5 h-3.5" />
          <span>Role: {data.user.role}</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:border-blue-100 transition-colors">
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mb-2.5`}>
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              <p className="text-lg font-bold text-gray-800 tracking-tight">{stat.value}</p>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5 uppercase tracking-wider">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-max">
          <h2 className="text-sm font-semibold mb-3 text-gray-700">Aksi Cepat</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  href={action.href}
                  key={action.label}
                  className="group block p-3 bg-gray-50/50 hover:bg-blue-50/50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                >
                  <ActionIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 mb-1.5 transition-colors" />
                  <p className="text-[11px] font-semibold text-gray-700 group-hover:text-blue-700">{action.label}</p>
                </Link>
              );
            })}
          </div>
        </div>
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Pembayaran Terakhir</h2>
            <Link href="/pembayaran" className="text-[11px] font-medium text-blue-600 hover:text-blue-700">Lihat Semua &rarr;</Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            {data.recentPembayaran.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">Belum ada transaksi pembayaran</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white text-gray-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2 border-b font-medium">ID Bayar</th>
                    <th className="px-4 py-2 border-b font-medium">Nominal</th>
                    <th className="px-4 py-2 border-b font-medium">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs text-gray-600">
                  {data.recentPembayaran.map((p: any) => (
                    <tr key={p.id_bayar} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-2 text-gray-400">#{p.id_bayar}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">Rp {p.nominal.toLocaleString()}</td>
                      <td className="px-4 py-2 text-gray-500">{new Date(p.tanggal).toLocaleDateString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
