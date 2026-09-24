"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, ArrowRight, DollarSign, Package, TrendingUp, Users } from "lucide-react";
import { Pagination } from "@/components/Pagination";

type LaporanData = {
  uangMasuk: { type: string; id: number; tanggal: string; nominal: number; keterangan: string }[];
  modal: { id_pesanan: number; tanggal: string; nama_klien: string; nama_barang: string; qty: number; harga_beli: number; total_modal: number }[];
  piutang: { id_pesanan: number; tanggal: string; nama_klien: string; nama_barang: string; total_harga: number; status: string }[];
  komisi: { id_komisi: number; tanggal: string; nama_user: string; role: string; nominal: number }[];
};

export default function LaporanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"uangMasuk" | "modal" | "piutang" | "komisi">("uangMasuk");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const loadData = async (start = "", end = "") => {
    setLoading(true);
    let url = "/api/laporan";
    if (start && end) url += `?start=${start}&end=${end}`;
    
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
      } else {
        console.error("Failed to load");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && session.user.role !== "ADMIN") { router.push("/"); return; }
    if (status === "authenticated") loadData();
  }, [status, router]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      loadData(startDate, endDate);
    } else {
      loadData();
    }
  };

  if (status === "loading" || (loading && !data)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6" suppressHydrationWarning>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Laporan Keuangan
          </h1>
          <p className="text-sm text-gray-500 mt-1">Pantau rincian arus kas, modal, dan ekspektasi saldo.</p>
        </div>
        
        <form onSubmit={handleFilter} className="flex items-end gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-gray-500">Mulai</Label>
            <Input type="date" className="h-8 text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-gray-500">Akhir</Label>
            <Input type="date" className="h-8 text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <Button type="submit" size="sm" className="h-8 text-xs px-4 bg-blue-600 hover:bg-blue-700 text-white">Filter</Button>
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab("uangMasuk")} 
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === "uangMasuk" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <DollarSign className="w-4 h-4" /> Uang Masuk Bersih
        </button>
        <button 
          onClick={() => setActiveTab("modal")} 
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === "modal" ? "bg-rose-50 text-rose-700 border-b-2 border-rose-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Package className="w-4 h-4" /> Rincian Modal
        </button>
        <button 
          onClick={() => setActiveTab("piutang")} 
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === "piutang" ? "bg-cyan-50 text-cyan-700 border-b-2 border-cyan-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <TrendingUp className="w-4 h-4" /> Ekspektasi Saldo (Piutang)
        </button>
        <button 
          onClick={() => setActiveTab("komisi")} 
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${activeTab === "komisi" ? "bg-purple-50 text-purple-700 border-b-2 border-purple-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Users className="w-4 h-4" /> Komisi Cair
        </button>
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        {loading && <div className="p-12 text-center text-gray-500">Memuat data...</div>}
        {!loading && (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {activeTab === "uangMasuk" && (
                    <tr>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Keterangan</th>
                      <th className="px-6 py-4">Tipe</th>
                      <th className="px-6 py-4 text-right">Nominal</th>
                    </tr>
                  )}
                  {activeTab === "modal" && (
                    <tr>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Klien</th>
                      <th className="px-6 py-4">Barang</th>
                      <th className="px-6 py-4 text-right">Harga Beli</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4 text-right">Total Modal</th>
                    </tr>
                  )}
                  {activeTab === "piutang" && (
                    <tr>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Klien</th>
                      <th className="px-6 py-4">Barang</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Total Harga</th>
                    </tr>
                  )}
                  {activeTab === "komisi" && (
                    <tr>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Nama Tim</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Keterangan</th>
                      <th className="px-6 py-4 text-right">Nominal Cair</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    
                    if (activeTab === "uangMasuk") {
                      const paginatedData = data.uangMasuk.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                      return data.uangMasuk.length === 0 ? <tr className="text-center"><td colSpan={4} className="p-8 text-gray-400">Tidak ada uang masuk/pengeluaran di tanggal ini.</td></tr> :
                      paginatedData.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
                        <td className="px-6 py-3">{item.keterangan}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${item.type === 'SETORAN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className={`px-6 py-3 whitespace-nowrap text-right font-medium ${item.nominal < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.nominal < 0 ? "-" : "+"} Rp {Math.abs(item.nominal).toLocaleString("id-ID")}
                        </td>
                        </tr>
                      ));
                    }
                    
                    if (activeTab === "modal") {
                      const paginatedData = data.modal.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                      return data.modal.length === 0 ? <tr className="text-center"><td colSpan={6} className="p-8 text-gray-400">Tidak ada pesanan di tanggal ini.</td></tr> :
                      paginatedData.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
                        <td className="px-6 py-3 font-medium">{item.nama_klien}</td>
                        <td className="px-6 py-3 text-gray-600">{item.nama_barang}</td>
                        <td className="px-6 py-3 text-right">Rp {item.harga_beli.toLocaleString("id-ID")}</td>
                        <td className="px-6 py-3 text-center">{item.qty}</td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-800">Rp {item.total_modal.toLocaleString("id-ID")}</td>
                        </tr>
                      ));
                    }
                    
                    if (activeTab === "piutang") {
                      const paginatedData = data.piutang.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                      return data.piutang.length === 0 ? <tr className="text-center"><td colSpan={5} className="p-8 text-gray-400">Tidak ada pesanan di tanggal ini.</td></tr> :
                      paginatedData.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
                        <td className="px-6 py-3 font-medium">{item.nama_klien}</td>
                        <td className="px-6 py-3 text-gray-600">{item.nama_barang}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${item.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-800">Rp {item.total_harga.toLocaleString("id-ID")}</td>
                        </tr>
                      ));
                    }
                    
                    if (activeTab === "komisi") {
                      const paginatedData = data.komisi.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                      return data.komisi.length === 0 ? <tr className="text-center"><td colSpan={5} className="p-8 text-gray-400">Tidak ada komisi cair di tanggal ini.</td></tr> :
                      paginatedData.map((item: any, i) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
                        <td className="px-6 py-3 font-medium">{item.nama_user}</td>
                        <td className="px-6 py-3 text-gray-600 text-[11px] font-semibold">{item.role}</td>
                        <td className="px-6 py-3 text-gray-600 text-sm italic">{item.keterangan}</td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-800">Rp {item.nominal.toLocaleString("id-ID")}</td>
                        </tr>
                      ));
                    }
                    
                    return null;
                  })()}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold border-t border-gray-200">
                  {activeTab === "uangMasuk" && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right">Total Uang Masuk Bersih:</td>
                      <td className="px-6 py-4 text-right text-emerald-700">
                        Rp {data.uangMasuk.reduce((sum, item) => sum + item.nominal, 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  )}
                  {activeTab === "modal" && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-right">Total Modal:</td>
                      <td className="px-6 py-4 text-right text-rose-700">
                        Rp {data.modal.reduce((sum, item) => sum + item.total_modal, 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  )}
                  {activeTab === "piutang" && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-right">Total Ekspektasi Saldo:</td>
                      <td className="px-6 py-4 text-right text-cyan-700">
                        Rp {data.piutang.reduce((sum, item) => sum + item.total_harga, 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  )}
                  {activeTab === "komisi" && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-right">Total Komisi Cair:</td>
                      <td className="px-6 py-4 text-right text-purple-700">
                        Rp {data.komisi.reduce((sum, item) => sum + item.nominal, 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
            {data[activeTab].length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalItems={data[activeTab].length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
