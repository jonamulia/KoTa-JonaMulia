"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Gift, PlusCircle, CheckCircle2, Trash2, Edit2, X } from "lucide-react";
import { Pagination } from "@/components/Pagination";

export default function KoreksiPage() {
  const { data: session } = useSession();
  const [tipsList, setTipsList] = useState([]);
  const [penagihList, setPenagihList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [id_penagih, setIdPenagih] = useState("");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNominal, setEditNominal] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tipsRes, usersRes] = await Promise.all([
        fetch("/api/koreksi"),
        fetch("/api/users")
      ]);
      const tipsData = await tipsRes.json();
      const usersData = await usersRes.json();
      
      setTipsList(tipsData);
      setPenagihList(usersData.filter((u: any) => u.role === "PENAGIH"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Berikan tips ini kepada penagih?\nSaldo profit Admin akan dipotong sesuai nominal tips.")) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/koreksi", {
        method: "POST",
        body: JSON.stringify({
          id_penagih,
          nominal,
          keterangan
        }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setIdPenagih("");
        setNominal("");
        setKeterangan("");
        fetchData();
      } else {
        const errorData = await res.json();
        alert("Gagal memberikan tips: " + (errorData.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus tips ini? Saldo profit Admin akan kembali bertambah.")) return;
    try {
      const res = await fetch(`/api/koreksi/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else alert("Gagal menghapus");
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!window.confirm("Simpan perubahan tips ini?")) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/koreksi/${editingId}`, {
        method: "PUT",
        body: JSON.stringify({ nominal: editNominal, keterangan: editKeterangan }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setEditingId(null);
        fetchData();
      } else {
        alert("Gagal menyimpan");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditSubmitting(false);
    }
  };

  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-gray-500">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTips = tipsList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4 relative">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
          <Gift className="w-4 h-4 text-blue-600" />
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Koreksi & Pemberian Tips</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Form Pemberian Tips</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Penagih Penerima</label>
            <select
              required
              value={id_penagih}
              onChange={(e) => setIdPenagih(e.target.value)}
              className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full bg-white transition-all"
            >
              <option value="">Pilih Penagih</option>
              {penagihList.map((u: any) => (
                <option key={u.id_user} value={u.id_user}>{u.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nominal Tips (Rp)</label>
            <input
              type="number"
              min="1"
              required
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="Contoh: 50000"
              className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full bg-white transition-all font-semibold"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 mb-1 block">Keterangan / Catatan</label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Berhasil menagih lunas dalam 3x"
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full bg-white transition-all"
              />
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? "Memproses..." : "Beri Tips"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-700">Riwayat Pemberian Tips</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Memuat riwayat...</div>
          ) : tipsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">Belum ada riwayat pemberian tips</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 border-b font-medium">Tanggal</th>
                  <th className="px-4 py-3 border-b font-medium">Penagih</th>
                  <th className="px-4 py-3 border-b font-medium">Nominal Tips</th>
                  <th className="px-4 py-3 border-b font-medium">Keterangan</th>
                  <th className="px-4 py-3 border-b font-medium text-center">Status</th>
                  <th className="px-4 py-3 border-b font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                {paginatedTips.map((t: any) => (
                  <tr key={t.id_log} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {t.nama_penagih}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      + Rp {t.nominal?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600 italic">
                      "{t.keterangan}"
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Sukses</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button 
                        onClick={() => {
                          setEditingId(t.id_log);
                          setEditNominal(t.nominal?.toString() || "");
                          setEditKeterangan(t.keterangan || "");
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id_log)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && tipsList.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={tipsList.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-gray-800">Edit Tips</h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  value={editNominal}
                  onChange={(e) => setEditNominal(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Keterangan</label>
                <input
                  type="text"
                  required
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {editSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
