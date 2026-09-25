"use client";
import Swal from 'sweetalert2';

import { useEffect, useState } from "react";
import { Package, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Pagination } from "@/components/Pagination";

export default function BarangPage() {
  const { data: session } = useSession();
  const [barang, setBarang] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [nama_barang, setNamaBarang] = useState("");
  const [harga, setHarga] = useState("");
  const [harga_beli, setHargaBeli] = useState("");
  const [komisi_penjualan, setKomisiPenjualan] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchBarang();
  }, []);

  const fetchBarang = async () => {
    try {
      const res = await fetch("/api/barang", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setBarang(data as never[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = isEditing ? `/api/barang/${editId}` : "/api/barang";
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        body: JSON.stringify({ nama_barang, harga, harga_beli, komisi_penjualan }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        resetForm();
        await fetchBarang();
        Swal.fire("Berhasil!", "Barang berhasil disimpan!", "success");
      } else {
        const d = await res.json();
        Swal.fire("Gagal!", d.error || "Terjadi kesalahan", "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (b: any) => {
    setIsEditing(true);
    setEditId(b.id_barang);
    setNamaBarang(b.nama_barang);
    setHarga(b.harga.toString());
    setHargaBeli(b.harga_beli?.toString() || "0");
    setKomisiPenjualan(b.komisi_penjualan?.toString() || "0");
  };

  const handleDelete = async (id: number) => {
    const swalResult = await Swal.fire({
      title: 'Konfirmasi',
      text: "Apakah Anda yakin ingin menghapus barang ini?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal'
    });
    if (!swalResult.isConfirmed) return;
    
    try {
      const res = await fetch(`/api/barang/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (isEditing && editId === id) resetForm();
        await fetchBarang();
        Swal.fire("Berhasil!", "Barang berhasil dihapus!", "success");
      } else {
        const d = await res.json();
        Swal.fire("Gagal!", d.error || "Gagal menghapus barang (mungkin sedang digunakan)", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setNamaBarang("");
    setHarga("");
    setHargaBeli("");
    setKomisiPenjualan("");
  };

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-purple-50 border border-purple-100 rounded-lg">
          <Package className="w-4 h-4 text-purple-600" />
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Master Data Barang</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Form Input - Bento */}
        {isAdmin && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-max lg:col-span-1">
            <h2 className="text-sm font-semibold mb-3 text-gray-700">{isEditing ? "Edit Barang" : "Tambah Barang Baru"}</h2>
            <form onSubmit={handleAddOrEdit} className="flex flex-col space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nama Barang</label>
                <input
                  type="text"
                  placeholder="Misal: Meja Lipat"
                  required
                  value={nama_barang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none w-full transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Harga Beli (Rp)</label>
                <input
                  type="number"
                  placeholder="Misal: 100000"
                  required
                  value={harga_beli}
                  onChange={(e) => setHargaBeli(e.target.value)}
                  className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none w-full transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Harga Jual (Rp)</label>
                <input
                  type="number"
                  placeholder="Misal: 150000"
                  required
                  value={harga}
                  onChange={(e) => setHarga(e.target.value)}
                  className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none w-full transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Komisi Penjualan (Rp)</label>
                <input
                  type="number"
                  placeholder="Misal: 25000"
                  required
                  value={komisi_penjualan}
                  onChange={(e) => setKomisiPenjualan(e.target.value)}
                  className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-300 outline-none w-full transition-all"
                />
              </div>
              
              <div className="flex flex-col space-y-2 mt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm w-full"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submitting ? "Menyimpan..." : isEditing ? "Update Barang" : "Simpan Barang"}</span>
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center justify-center space-x-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm w-full"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Tabel Data - Bento */}
        <div className={`${isAdmin ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col`}>
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-sm font-semibold text-gray-700">Daftar Barang</h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            {(() => {
              const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
              const paginatedBarang = barang.slice(startIndex, startIndex + ITEMS_PER_PAGE);

              if (loading) return <div className="p-8 text-center text-xs text-gray-400">Memuat data barang...</div>;
              if (barang.length === 0) return <div className="p-8 text-center text-xs text-gray-400">Belum ada data barang</div>;
              
              return (
              <table className="w-full text-left">
                <thead className="bg-white text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b font-medium">ID</th>
                    <th className="px-4 py-3 border-b font-medium">Nama Barang</th>
                    <th className="px-4 py-3 border-b font-medium text-right">Harga Beli</th>
                    <th className="px-4 py-3 border-b font-medium text-right">Harga Jual</th>
                    <th className="px-4 py-3 border-b font-medium text-right">Komisi Sales</th>
                    {isAdmin && <th className="px-4 py-3 border-b font-medium text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                  {paginatedBarang.map((b: any) => (
                    <tr key={b.id_barang} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-4 py-2.5 text-gray-400">#{b.id_barang}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{b.nama_barang}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">
                        Rp {(b.harga_beli || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                        Rp {b.harga.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-purple-600 font-medium">
                        Rp {(b.komisi_penjualan || 0).toLocaleString()}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2.5 text-center space-x-2">
                          <button
                            onClick={() => handleEditClick(b)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors inline-block"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id_barang)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors inline-block"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              );
            })()}
          </div>
          {!loading && barang.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={barang.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
