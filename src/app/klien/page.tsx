import Swal from 'sweetalert2';
"use client";

import { useEffect, useState } from "react";
import { Users, PlusCircle, MapPin, Phone } from "lucide-react";
import { useSession } from "next-auth/react";
import { Pagination } from "@/components/Pagination";

export default function KlienPage() {
  const { data: session } = useSession();
  const [klien, setKlien] = useState([]);
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [kontak, setKontak] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchKlien();
  }, []);

  const fetchKlien = async () => {
    try {
      const res = await fetch("/api/klien", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setKlien(data as never[]);
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
      const res = await fetch("/api/klien", {
        method: "POST",
        body: JSON.stringify({ nama, alamat, kontak }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setNama("");
        setAlamat("");
        setKontak("");
        await fetchKlien();
        Swal.fire("Berhasil!", "Klien berhasil disimpan!", "success");
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
          <Users className="w-4 h-4 text-blue-600" />
        </div>
        <h1 className="text-lg font-semibold text-gray-800">Master Data Klien</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form Input - Bento */}
        {isAdmin && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-max">
            <h2 className="text-sm font-semibold mb-3 text-gray-700">Tambah Klien Baru</h2>
            <form onSubmit={handleAdd} className="flex flex-col space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nama Klien</label>
                <input
                  type="text"
                  placeholder="Misal: Budi (RT04)"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Alamat</label>
                <input
                  type="text"
                  placeholder="Opsional"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Kontak</label>
                <input
                  type="text"
                  placeholder="Opsional"
                  value={kontak}
                  onChange={(e) => setKontak(e.target.value)}
                  className="border border-gray-200 px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none w-full transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{submitting ? "Menyimpan..." : "Simpan Klien"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Tabel Data - Bento */}
        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col`}>
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-sm font-semibold text-gray-700">Daftar Klien</h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            {(() => {
              const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
              const paginatedKlien = klien.slice(startIndex, startIndex + ITEMS_PER_PAGE);

              if (loading) return <div className="p-8 text-center text-xs text-gray-400">Memuat data klien...</div>;
              if (klien.length === 0) return <div className="p-8 text-center text-xs text-gray-400">Belum ada data klien</div>;
              
              return (
              <table className="w-full text-left">
                <thead className="bg-white text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b font-medium">ID</th>
                    <th className="px-4 py-3 border-b font-medium">Nama</th>
                    <th className="px-4 py-3 border-b font-medium">Alamat</th>
                    <th className="px-4 py-3 border-b font-medium">Kontak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
                  {paginatedKlien.map((k: any) => (
                    <tr key={k.id_klien} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-2.5 text-gray-400">#{k.id_klien}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{k.nama}</td>
                      <td className="px-4 py-2.5">{k.alamat || "-"}</td>
                      <td className="px-4 py-2.5">{k.kontak || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              );
            })()}
          </div>
          {!loading && klien.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={klien.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
