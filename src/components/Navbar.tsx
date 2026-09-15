"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Package, Wallet, Scissors, LogOut, FileText, Gift } from "lucide-react";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/laporan", label: "Laporan", icon: FileText, adminOnly: true },
  { href: "/klien", label: "Klien", icon: Users, adminOnly: true },
  { href: "/barang", label: "Barang", icon: Package, adminOnly: true },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/pesanan", label: "Pesanan", icon: Package },
  { href: "/pembayaran", label: "Pembayaran", icon: Wallet },
  { href: "/potongan", label: "Potongan", icon: Scissors },
  { href: "/koreksi", label: "Koreksi", icon: Gift, adminOnly: true },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const role = session.user.role;
  const filteredLinks = navLinks.filter((link) => {
    if (role === "ADMIN") return true;
    if (link.href === "/") return true;
    if (link.href === "/pesanan" && (role === "SALES" || role === "NEGO")) return true;
    if (link.href === "/pembayaran" && role === "PENAGIH") return true;
    return false;
  });

  return (
    <nav className="bg-card/80 backdrop-blur-xl border-b border-border/40 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div className="flex gap-1 items-center">
        <Link href="/" className="font-bold text-lg tracking-tight text-foreground mr-6">
          KoTa<span className="text-primary">.</span>
        </Link>
        <div className="hidden md:flex items-center gap-0.5">
          {filteredLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon size={15} strokeWidth={2} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right mr-1 hidden md:block">
          <p className="text-sm font-medium text-foreground leading-tight">{session.user.name}</p>
          <p className="text-[11px] text-muted-foreground">{session.user.role}</p>
        </div>
        <Button variant="ghost" size="sm" className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut size={16} />
        </Button>
      </div>
    </nav>
  );
}
