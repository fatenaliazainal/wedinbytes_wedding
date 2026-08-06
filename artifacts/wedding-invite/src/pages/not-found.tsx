import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center px-6">
        <p className="text-7xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Halaman tidak dijumpai
        </h1>
        <p className="text-gray-500 mb-8">
          Halaman yang anda cari tidak wujud atau telah dialihkan.
        </p>
        <Link href="/">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            Kembali ke Laman Utama
          </button>
        </Link>
      </div>
    </div>
  );
}
