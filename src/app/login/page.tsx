"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await signIn("credentials", { username, password, redirect: false });
    setIsLoading(false);

    if (res?.error) {
      setError("Username atau password salah.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            KoTa<span className="text-primary">.</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Sistem Manajemen Tagihan & Komisi</p>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-base font-semibold">Masuk</CardTitle>
            <CardDescription className="text-xs">Masukkan kredensial Anda</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs">Username</Label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username" type="text" placeholder="username"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    className="h-10 pl-9 text-sm" required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password" type="password" placeholder="password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pl-9 text-sm" required
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-xs px-3 py-2.5 rounded-lg">
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button type="submit" className="w-full h-10 cursor-pointer text-sm font-medium" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses
                  </span>
                ) : "Masuk"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
