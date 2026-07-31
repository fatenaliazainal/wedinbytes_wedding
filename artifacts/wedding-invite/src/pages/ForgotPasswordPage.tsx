import { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import logo from "@assets/LOGO WEDINBYTES (1).png";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const token = useMemo(() => new URLSearchParams(search).get("token") || "", [search]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReset(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setLoading(true);
    try {
      const response = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Permintaan reset gagal.");
      setMessage(data.message);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Permintaan reset gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 6) {
      setError("Kata laluan mesti sekurang-kurangnya 6 aksara.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Kata laluan dan pengesahan kata laluan tidak sepadan.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reset kata laluan gagal.");
      setMessage(data.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset kata laluan gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#faf9f7] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="WedInBytes"
            className="mx-auto h-20 w-auto object-contain"
          />
          <p className="text-sm text-gray-500 mt-1">
            {token ? "Set a new password" : "Reset your password"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {token ? (
            <form onSubmit={resetPassword} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
                />
              </div>
              {error && <div className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
              {message && <div className="text-green-700 text-sm bg-green-50 border border-green-100 rounded-lg px-3 py-2">{message}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          ) : (
            <form onSubmit={requestReset} className="space-y-4">
              <p className="text-sm leading-relaxed text-gray-500">
                Enter your account email and we’ll create a password reset link.
              </p>
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@email.com"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
                />
              </div>
              {error && <div className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
              {message && <div className="text-green-700 text-sm bg-green-50 border border-green-100 rounded-lg px-3 py-2">{message}</div>}
              {resetUrl && (
                <a
                  href={resetUrl}
                  className="block rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 underline break-all"
                >
                  Open reset link
                </a>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{" "}
            <a
              href="#"
              onClick={(event) => { event.preventDefault(); navigate("/login"); }}
              className="text-gray-800 font-medium hover:underline"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}