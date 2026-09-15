"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Pencil, Trash2, ShieldCheck, X } from "lucide-react";
import { Pagination } from "@/components/Pagination";

type User = { id_user: number; nama: string; username: string; role: string };

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [id, setId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SALES");

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = id ? `/api/users/${id}` : "/api/users";
    const method = id ? "PUT" : "POST";
    const body: any = { nama, username, role };
    if (password) body.password = password;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { resetForm(); loadUsers(); }
    else alert("Terjadi kesalahan.");
  };

  const handleEdit = (u: User) => {
    setId(u.id_user); setNama(u.nama); setUsername(u.username); setRole(u.role); setPassword("");
    setShowForm(true);
  };

  const handleDelete = async (deleteId: number) => {
    if (!confirm("Hapus user ini?")) return;
    await fetch(`/api/users/${deleteId}`, { method: "DELETE" });
    loadUsers();
  };

  const resetForm = () => {
    setId(null); setNama(""); setUsername(""); setPassword(""); setRole("SALES");
    setShowForm(false);
  };

  const roleBadge = (r: string) => {
    const map: Record<string, string> = {
      ADMIN: "bg-violet-100 text-violet-700",
      NEGO: "bg-amber-100 text-amber-700",
      SALES: "bg-blue-100 text-blue-700",
      PENAGIH: "bg-emerald-100 text-emerald-700",
    };
    return map[r] || "bg-gray-100 text-gray-700";
  };

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ShieldCheck size={32} className="text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">Akses Ditolak</p>
        <p className="text-xs text-muted-foreground">Hanya Admin yang bisa mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Manajemen User</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola akun pengguna sistem</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }} className="cursor-pointer gap-1.5 text-xs">
          {showForm ? <><X size={14} /> Tutup</> : <><UserPlus size={14} /> Tambah User</>}
        </Button>
      </div>

      {showForm && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">{id ? "Edit Pengguna" : "Tambah Pengguna Baru"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama</Label>
                <Input value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama lengkap" className="h-9 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Username</Label>
                <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" className="h-9 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password {id && <span className="text-muted-foreground">(opsional)</span>}</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="h-9 text-sm" required={!id} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Peran</Label>
                <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="ADMIN">Admin</option>
                  <option value="NEGO">Nego</option>
                  <option value="SALES">Sales</option>
                  <option value="PENAGIH">Penagih</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-2 pt-1">
                <Button type="submit" size="sm" className="cursor-pointer text-xs">{id ? "Simpan" : "Tambahkan"}</Button>
                <Button type="button" size="sm" variant="ghost" className="cursor-pointer text-xs" onClick={resetForm}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-accent/30">
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Nama</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Username</th>
                <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">Peran</th>
                <th className="text-right py-3 px-4 text-xs text-muted-foreground font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                const paginatedUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                
                return paginatedUsers.map(u => (
                <tr key={u.id_user} className="border-b border-border/20 last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-sm">{u.nama}</td>
                  <td className="py-3 px-4 text-muted-foreground text-sm">@{u.username}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${roleBadge(u.role)}`}>{u.role}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 p-0" onClick={() => handleEdit(u)}>
                        <Pencil size={13} />
                      </Button>
                      {u.username !== "admin" && (
                        <Button size="sm" variant="ghost" className="cursor-pointer h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(u.id_user)}>
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  </td>
                  </tr>
                ));
              })()}
              {users.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-xs text-muted-foreground">Belum ada pengguna.</td></tr>
              )}
            </tbody>
          </table>
          {users.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={users.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
          </>
        )}
      </div>
    </div>
  );
}
