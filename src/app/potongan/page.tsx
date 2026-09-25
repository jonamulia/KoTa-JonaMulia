"use client";
import Swal from 'sweetalert2';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Inbox, AlertTriangle, Scissors } from "lucide-react";
import { Pagination } from "@/components/Pagination";

type User = { id_user: number; nama: string; role: string };
type Potongan = {
  id_potongan: number; jenis: string; nominal: number;
  tanggal: string; id_user: number; user_nama: string;
};

export default function PotonganPage() {
  const { data: session } = useSession();
  const [potongan, setPotongan] = useState<Potongan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [jenisSelect, setJenisSelect] = useState("UANG SAKU");
  const [jenisCustom, setJenisCustom] = useState("");
  const [nominal, setNominal] = useState("");
  const [idUser, setIdUser] = useState("");

  const loadData = async () => {
    setLoading(true);
    const [pRes, uRes] = await Promise.all([fetch("/api/potongan", { cache: "no-store" }), fetch("/api/users", { cache: "no-store" })]);
    if (pRes.ok) setPotongan(await pRes.json());
    if (uRes.ok) setUsers(await uRes.json());
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const fieldUsers = users.filter(u => ["ADMIN", "SALES", "NEGO", "PENAGIH"].includes(u.role));
  const totalPotongan = potongan.reduce((sum, p) => sum + p.nominal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalJenis = jenisSelect === "LAINNYA" ? jenisCustom : jenisSelect;
    if (!finalJenis.trim()) return Swal.fire("Informasi", "Jenis potongan harus diisi!", "info");

    const res = await fetch("/api/potongan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jenis: finalJenis, nominal, id_user: idUser }),
    });
    if (res.ok) {
      resetForm(); await loadData();
      Swal.fire("Berhasil!", "Potongan berhasil dicatat.", "success");
    } else { const err = await res.json(); Swal.fire("Gagal!", err.error || "Terjadi kesalahan.", "error"); }
  };

  const resetForm = () => { setJenisSelect("UANG SAKU"); setJenisCustom(""); setNominal(""); setIdUser(""); setShowForm(false); };

  const jenisBadge = (j: string) => {
    const map: Record<string, string> = {
      "UANG SAKU": "bg-blue-100 text-blue-700",
      "SABUN RT": "bg-cyan-100 text-cyan-700",
      "SABUN WARGA": "bg-teal-100 text-teal-700",
    };
    return map[j] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Data Potongan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Catat uang saku, potongan sabun, dll.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-right">
            <Scissors size={16} className="text-red-500" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">Total Potongan</p>
              <p className="text-sm font-bold text-red-500">Rp {totalPotongan.toLocaleString("id-ID")}</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }} className="cursor-pointer gap-1.5 text-xs">
            {showForm ? <><X size={14} /> Tutup</> : <><Plus size={14} /> Catat Potongan</>}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Catat Potongan Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Jenis</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={jenisSelect} onChange={e => setJenisSelect(e.target.value)} required>
                  <option value="UANG SAKU">Uang Saku</option>
                  <option value="SABUN RT">Sabun RT</option>
                  <option value="SABUN WARGA">Sabun Warga</option>
                  <option value="LAINNYA">Lainnya (Manual)</option>
                </select>
                {jenisSelect === "LAINNYA" && (
                  <Input type="text" value={jenisCustom} onChange={e => setJenisCustom(e.target.value)} placeholder="Tulis jenis potongan..." className="h-9 text-sm mt-2" required />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nominal (Rp)</Label>
                <Input type="number" value={nominal} onChange={e => setNominal(e.target.value)} placeholder="Misal: 50000" className="h-9 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pengguna</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={idUser} onChange={e => setIdUser(e.target.value)} required>
                  <option value="">Pilih Pengguna</option>
                  {fieldUsers.map(u => <option key={u.id_user} value={u.id_user}>{u.nama} ({u.role})</option>)}
                </select>
              </div>
              <div className="md:col-span-3 flex gap-2 pt-1">
                <Button type="submit" size="sm" className="cursor-pointer text-xs">Catat Potongan</Button>
                <Button type="button" size="sm" variant="ghost" className="cursor-pointer text-xs" onClick={resetForm}>Batal</Button>
              </div>
            </form>
            <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                Potongan akan mengurangi saldo komisi pengguna. Khusus <b>Uang Saku</b>, sistem akan otomatis memecah nominal menjadi beban potongan karyawan & subsidi bensin (Admin).
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : potongan.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Inbox size={28} className="text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">Belum ada potongan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-accent/30">
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">ID</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Jenis</th>
                  <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium">Nominal</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Pengguna</th>
                  <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const sortedPotongan = [...potongan].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
                  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                  const paginatedPotongan = sortedPotongan.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                  
                  return paginatedPotongan.map(p => (
                  <tr key={p.id_potongan} className="border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-sm">#{p.id_potongan}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${jenisBadge(p.jenis)}`}>{p.jenis}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-red-500 text-sm">-Rp {p.nominal.toLocaleString("id-ID")}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{p.user_nama}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {new Date(p.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}
        {!loading && potongan.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={potongan.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
