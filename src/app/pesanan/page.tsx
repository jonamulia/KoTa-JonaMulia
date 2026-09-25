import Swal from 'sweetalert2';
"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, PlusCircle, User, Package, Edit2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Pagination } from "@/components/Pagination";

export default function PesananPage() {
  const { data: session } = useSession();
  const [pesanan, setPesanan] = useState([]);
  const [klienList, setKlienList] = useState([]);
  const [barangList, setBarangList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [negoList, setNegoList] = useState([]);

  // Create form state
  const [id_klien, setIdKlien] = useState("");
  const [id_barang, setIdBarang] = useState("");
  const [qty, setQty] = useState("1");
  const [id_sales, setIdSales] = useState("");
  const [id_nego, setIdNego] = useState("");
  const [tanggal, setTanggal] = useState("");
  
  // Filter state
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterKlien, setFilterKlien] = useState("");
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pesananRes, klienRes, barangRes, usersRes] = await Promise.all([
        fetch("/api/pesanan", { cache: "no-store" }),
        fetch("/api/klien", { cache: "no-store" }),
        fetch("/api/barang", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" })
      ]);
      const [pesananData, klienData, barangData, usersData] = await Promise.all([
        pesananRes.json(),
        klienRes.json(),
        barangRes.json(),
        usersRes.json()
      ]);
      
      setPesanan(pesananData);
      setKlienList(klienData);
      setBarangList(barangData);
      setSalesList(usersData.filter((u: any) => u.role === "SALES"));
      setNegoList(usersData.filter((u: any) => u.role === "NEGO"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedBarang = barangList.find((b: any) => b.id_barang.toString() === id_barang.toString()) as any;
      const res = await fetch("/api/pesanan", {
        method: "POST",
        body: JSON.stringify({ 
          tanggal,
          id_klien, 
          id_barang, 
          qty,
          total_harga: selectedBarang?.harga ? selectedBarang.harga * parseInt(qty || "1") : 0,
          id_sales, 
          id_nego 
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setTanggal("");
        setIdKlien("");
        setIdBarang("");
        setQty("1");
        setIdSales("");
        setIdNego("");
        await fetchData();
        Swal.fire("Berhasil!", "Pesanan berhasil disimpan!", "success");
      } else {
        const errorData = await res.json();
        Swal.fire("Gagal!", "Gagal menyimpan pesanan: " + (errorData.error || "Unknown error", "error"););
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire("Gagal!", "Terjadi kesalahan sistem: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id_pesanan: string) => {
    if (!window.confirm("Yakin ingin menghapus pesanan ini?\n\nPERINGATAN: Semua riwayat pembayaran & komisi terkait pesanan ini juga akan terhapus.")) {
      return;
    }
    try {
      const res = await fetch(`/api/pesanan/${id_pesanan}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        Swal.fire("Gagal!", "Gagal menghapus pesanan.", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal!", "Gagal menghapus pesanan.", "error");
    }
  };

  const openEditModal = (p: any) => {
    setEditingItem({
      ...p,
      qty: p.qty.toString(),
      id_klien: p.id_klien.toString(),
      id_barang: p.id_barang.toString(),
      id_sales: p.id_sales.toString(),
      id_nego: p.id_nego.toString(),
      total_harga: p.total_harga.toString(),
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Simpan Perubahan?\n\nSemua riwayat komisi (gaji) dari cicilan yang sudah masuk akan otomatis dikalkulasi ulang menyesuaikan Harga/Qty yang baru.")) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pesanan/${editingItem.id_pesanan}`, {
        method: "PUT",
        body: JSON.stringify({
          id_klien: editingItem.id_klien,
          id_barang: editingItem.id_barang,
          qty: editingItem.qty,
          total_harga: editingItem.total_harga,
          id_sales: editingItem.id_sales,
          id_nego: editingItem.id_nego,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        Swal.fire("Gagal!", "Gagal mengedit: " + data.error, "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal!", "Gagal mengedit pesanan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBarangChange = (new_id_barang: string) => {
    const selectedBarang = barangList.find((b: any) => b.id_barang.toString() === new_id_barang.toString()) as any;
    setEditingItem({
      ...editingItem,
      id_barang: new_id_barang,
      total_harga: selectedBarang ? (selectedBarang.harga * parseInt(editingItem.qty || "1")).toString() : editingItem.total_harga,
    });
  };

  const handleEditQtyChange = (new_qty: string) => {
    const selectedBarang = barangList.find((b: any) => b.id_barang.toString() === editingItem.id_barang.toString()) as any;
    setEditingItem({
      ...editingItem,
      qty: new_qty,
      total_harga: selectedBarang ? (selectedBarang.harga * parseInt(new_qty || "1")).toString() : editingItem.total_harga,
    });
  };

  const isAdmin = session?.user?.role === "ADMIN";

  const filteredPesanan = pesanan.filter((p: any) => {
    let matchesKlien = true;
    let matchesStartDate = true;
    let matchesEndDate = true;
    
    if (filterKlien) {
      matchesKlien = p.nama_klien.toLowerCase().includes(filterKlien.toLowerCase());
    }
    
    if (filterStartDate) {
      matchesStartDate = new Date(p.tanggal) >= new Date(filterStartDate);
    }
    
    if (filterEndDate) {
      matchesEndDate = new Date(p.tanggal) <= new Date(filterEndDate + "T23:59:59");
    }
    
    return matchesKlien && matchesStartDate && matchesEndDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStartDate, filterEndDate, filterKlien]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPesanan = filteredPesanan.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4 relative">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-green-50 border border-green-100 rounded-lg">
          <ShoppingCart className="w-4 h-4 text-green-600" />
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Manajemen Pesanan</h1>
      </div>

      {isAdmin && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold mb-3 text-gray-700">Buat Pesanan Baru</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300 outline-none w-full bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Klien</label>
              <select
                required
                value={id_klien}
                onChange={(e) => setIdKlien(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300 outline-none w-full bg-white transition-all"
              >
                <option value="">Pilih Klien</option>
                {klienList.map((k: any) => (
                  <option key={k.id_klien} value={k.id_klien}>{k.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Barang</label>
              <select
                required
                value={id_barang}
                onChange={(e) => setIdBarang(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300 outline-none w-full bg-white transition-all"
              >
                <option value="">Pilih Barang</option>
                {barangList.map((b: any) => (
                  <option key={b.id_barang} value={b.id_barang}>{b.nama_barang} - Rp {b.harga.toLocaleString()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Jumlah (Qty)</label>
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300 outline-none w-full bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Sales</label>
              <select
                required
                value={id_sales}
                onChange={(e) => setIdSales(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300 outline-none w-full bg-white transition-all"
              >
                <option value="">Pilih Sales</option>
                {salesList.map((u: any) => (
                  <option key={u.id_user} value={u.id_user}>{u.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nego</label>
              <select
                required
                value={id_nego}
                onChange={(e) => setIdNego(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300 outline-none w-full bg-white transition-all"
              >
                <option value="">Pilih Nego</option>
                {negoList.map((u: any) => (
                  <option key={u.id_user} value={u.id_user}>{u.nama}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end mt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center space-x-1.5 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? "Menyimpan..." : "Buat Pesanan"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Filter Pencarian</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Dari Tanggal</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300 outline-none w-full bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Sampai Tanggal</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300 outline-none w-full bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Nama Klien</label>
              <input
                type="text"
                placeholder="Cari nama klien..."
                value={filterKlien}
                onChange={(e) => setFilterKlien(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300 outline-none w-full bg-white transition-all"
              />
            </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-700">Daftar Pesanan {isAdmin ? '' : 'Anda'}</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400">Memuat data pesanan...</div>
          ) : filteredPesanan.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">Belum ada data pesanan</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  {!isAdmin && <th className="px-4 py-3 border-b font-medium">Tanggal</th>}
                  {isAdmin && <th className="px-4 py-3 border-b font-medium">ID</th>}
                  <th className="px-4 py-3 border-b font-medium">Klien</th>
                  {isAdmin && <th className="px-4 py-3 border-b font-medium">Barang</th>}
                  <th className="px-4 py-3 border-b font-medium">Qty</th>
                  <th className="px-4 py-3 border-b font-medium">Total Harga</th>
                  {!isAdmin && (
                    <>
                      <th className="px-4 py-3 border-b font-medium">Komisi Didapat</th>
                      <th className="px-4 py-3 border-b font-medium">Uang Masuk</th>
                      <th className="px-4 py-3 border-b font-medium">Komisi Cair</th>
                    </>
                  )}
                  <th className="px-4 py-3 border-b font-medium">Tim (S / N)</th>
                  <th className="px-4 py-3 border-b font-medium text-center">Status</th>
                  {isAdmin && <th className="px-4 py-3 border-b font-medium text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                {paginatedPesanan.map((p: any) => (
                  <tr key={p.id_pesanan} className="hover:bg-green-50/30 transition-colors">
                    {!isAdmin && (
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    )}
                    {isAdmin && <td className="px-4 py-2.5 text-gray-400">#{p.id_pesanan}</td>}
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{p.nama_klien}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center space-x-1.5">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          <span>{p.nama_barang}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-gray-600 font-medium text-center">
                      {p.qty || 1}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">
                      Rp {p.total_harga.toLocaleString()}
                    </td>
                    {!isAdmin && (
                      <>
                        <td className="px-4 py-2.5 text-gray-700">Rp {p.komisi_didapat?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2.5 text-blue-600 font-medium">Rp {p.total_dibayar?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2.5 text-green-600 font-bold">Rp {p.komisi_cair?.toLocaleString() || 0}</td>
                      </>
                    )}
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      <div className="truncate w-24">S: {p.sales_nama}</div>
                      <div className="truncate w-24">N: {p.nego_nama}</div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'LUNAS' ? 'bg-green-100 text-green-700' :
                        p.status === 'MACET' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                            title="Edit Pesanan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id_pesanan)}
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                            title="Hapus Pesanan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filteredPesanan.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPesanan.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Edit2 className="w-5 h-5 mr-2 text-blue-600" />
                Edit Pesanan #{editingItem.id_pesanan}
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Klien</label>
                  <select
                    required
                    value={editingItem.id_klien}
                    onChange={(e) => setEditingItem({...editingItem, id_klien: e.target.value})}
                    className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
                  >
                    <option value="">Pilih Klien</option>
                    {klienList.map((k: any) => (
                      <option key={k.id_klien} value={k.id_klien}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Barang</label>
                  <select
                    required
                    value={editingItem.id_barang}
                    onChange={(e) => handleEditBarangChange(e.target.value)}
                    className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
                  >
                    <option value="">Pilih Barang</option>
                    {barangList.map((b: any) => (
                      <option key={b.id_barang} value={b.id_barang}>{b.nama_barang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingItem.qty}
                    onChange={(e) => handleEditQtyChange(e.target.value)}
                    className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Total Harga Baru (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingItem.total_harga}
                    onChange={(e) => setEditingItem({...editingItem, total_harga: e.target.value})}
                    className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full bg-blue-50 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Sales</label>
                  <select
                    required
                    value={editingItem.id_sales}
                    onChange={(e) => setEditingItem({...editingItem, id_sales: e.target.value})}
                    className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
                  >
                    {salesList.map((u: any) => (
                      <option key={u.id_user} value={u.id_user}>{u.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Nego</label>
                  <select
                    required
                    value={editingItem.id_nego}
                    onChange={(e) => setEditingItem({...editingItem, id_nego: e.target.value})}
                    className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-full"
                  >
                    {negoList.map((u: any) => (
                      <option key={u.id_user} value={u.id_user}>{u.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
