import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const { adminLogin, user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(search);
  const redirect = params.get("redirect") || "/admin";

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.role === "admin" ? redirect : "/dashboard");
    }
  }, [user, authLoading, navigate, redirect]);

  if (authLoading || user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(password);
      navigate(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Wedinstudio Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Enter the admin password to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Access Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
