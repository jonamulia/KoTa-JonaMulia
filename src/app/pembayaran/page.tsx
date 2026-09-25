import Swal from 'sweetalert2';
"use client";

import { useEffect, useState } from "react";
import { DollarSign, PlusCircle, CreditCard, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Pagination } from "@/components/Pagination";

export default function PenagihanPage() {
  const { data: session } = useSession();
  const [penagihan, setPenagihan] = useState([]);
  const [pesananList, setPesananList] = useState([]);
  const [penagihList, setPenagihList] = useState([]);

  const [id_pesanan, setIdPesanan] = useState("");
  const [id_penagih, setIdPenagih] = useState("");
  const [status, setStatus] = useState("BERHASIL");
  const [nominal, setNominal] = useState("");
  const [catatan, setCatatan] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [penagihanRes, pesananRes, usersRes] = await Promise.all([
        fetch("/api/pembayaran", { cache: "no-store" }),
        fetch("/api/pesanan", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" })
      ]);
      const [penagihanData, pesananData, usersData] = await Promise.all([
        penagihanRes.json(),
        pesananRes.json(),
        usersRes.json()
      ]);
      
      setPenagihan(penagihanData);
      setPesananList(pesananData.filter((p: any) => p.status === "AKTIF")); // only active pesanan
      setPenagihList(usersData.filter((u: any) => u.role === "PENAGIH"));
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
      const body: any = { id_pesanan, id_penagih, status };
      if (status === "BERHASIL") {
        body.nominal = nominal;
      } else {
        body.catatan = catatan;
      }

      const res = await fetch("/api/pembayaran", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setIdPesanan("");
        setIdPenagih("");
        setNominal("");
        setCatatan("");
        setStatus("BERHASIL");
        await fetchData();
        Swal.fire("Berhasil!", "Pembayaran/Penagihan berhasil dicatat!", "success");
      } else {
        const errorData = await res.json();
        Swal.fire("Gagal!", errorData.error || "Terjadi kesalahan.", "error");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
          <DollarSign className="w-4 h-4 text-blue-600" />
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Riwayat Penagihan</h1>
      </div>

      {isAdmin && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold mb-3 text-gray-700">Input Proses Penagihan</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Pesanan</label>
              <select
                required
                value={id_pesanan}
                onChange={(e) => setIdPesanan(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full bg-white transition-all"
              >
                <option value="">Pilih Pesanan (Aktif)</option>
                {pesananList.map((p: any) => (
                  <option key={p.id_pesanan} value={p.id_pesanan}>#{p.id_pesanan} - {p.nama_klien} - Rp{p.total_harga.toLocaleString()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Penagih</label>
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
              <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full bg-white transition-all"
              >
                <option value="BERHASIL">BERHASIL (Uang Masuk)</option>
                <option value="GAGAL">GAGAL (Rumah Kosong dll)</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                {status === "BERHASIL" ? "Nominal Pembayaran" : "Catatan / Alasan"}
              </label>
              {status === "BERHASIL" ? (
                <input
                  type="number"
                  placeholder="Rp"
                  required
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full transition-all"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Contoh: Rumah kosong / Menolak bayar"
                  required
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full transition-all"
                />
              )}
            </div>

            <div className="flex items-end mt-1 lg:mt-0">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm w-full lg:w-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? "Menyimpan..." : "Simpan Penagihan"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-700">Daftar Riwayat Penagihan</h2>
        </div>
        <div className="overflow-x-auto">
          {(() => {
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const paginatedPenagihan = penagihan.slice(startIndex, startIndex + ITEMS_PER_PAGE);

            if (loading) return <div className="p-8 text-center text-xs text-gray-400">Memuat riwayat penagihan...</div>;
            if (penagihan.length === 0) return <div className="p-8 text-center text-xs text-gray-400">Belum ada riwayat penagihan</div>;
            
            return (
              <table className="w-full text-left">
              <thead className="bg-white text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 border-b font-medium">Pesanan</th>
                  <th className="px-4 py-3 border-b font-medium text-center">Tahap</th>
                  <th className="px-4 py-3 border-b font-medium">Penagih</th>
                  <th className="px-4 py-3 border-b font-medium">Status</th>
                  <th className="px-4 py-3 border-b font-medium">Detail</th>
                  <th className="px-4 py-3 border-b font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                {paginatedPenagihan.map((p: any) => (
                  <tr key={p.id_penagihan} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-gray-800">#{p.id_pesanan}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 border border-indigo-100 rounded text-[10px] font-bold">
                        {p.percobaan_ke}/5
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{p.penagih_nama}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        p.status === 'BERHASIL' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.status === 'BERHASIL' ? <CreditCard className="w-3 h-3"/> : <AlertCircle className="w-3 h-3"/>}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {p.status === 'BERHASIL' ? `Rp ${p.nominal.toLocaleString()}` : <span className="text-gray-400 italic text-xs">{p.catatan}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">
                      {new Date(p.tanggal).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            );
          })()}
        </div>
        {!loading && penagihan.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={penagihan.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
