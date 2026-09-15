import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isApi = req.nextUrl.pathname.startsWith("/api/");
    const method = req.method;

    // Jika mengakses API dan metodenya adalah POST, PUT, DELETE, dll (Bukan GET)
    // Pastikan user memiliki role ADMIN.
    if (isApi && method !== "GET" && token?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya Admin yang dapat menambah atau mengubah data." },
        { status: 403 }
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Izinkan akses jika token ada (user sudah login)
      authorized: ({ token }) => !!token,
    },
  }
);

// Terapkan middleware ini ke semua route kecuali next static files, images, dan auth endpoints
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth|api/seed|api/laporan).*)"],
};
