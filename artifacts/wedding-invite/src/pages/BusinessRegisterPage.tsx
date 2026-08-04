import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Building2, Check } from "lucide-react";
import logo from "@assets/logo-wedinstudio.png";

const PERKS = [
  "Manage all client invitations from one dashboard",
  "Receive orders via your branded order form",
  "Share RSVP summaries with each client",
  "Public business profile on Wedinstudio",
];

export default function BusinessRegisterPage() {
  const { register, user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(user.role === "business_account" ? "/business/dashboard" : "/dashboard");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name, "business_account");
      navigate("/business/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#faf9f7] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mx-auto block hover:opacity-70 transition-opacity"
            aria-label="Go to Wedinstudio home"
          >
            <img
              src={logo}
              alt="Wedinstudio"
              className="mx-auto h-16 w-auto object-contain"
            />
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Left — perks */}
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white mb-6">
              <Building2 size={11} />
              Business Account
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
              Start managing client invitations today.
            </h1>
            <p className="text-sm text-gray-500 leading-6 mb-8">
              A Business Account gives you all the tools a wedding planner or event company needs — order forms, a client dashboard, RSVP tracking, and more.
            </p>
            <ul className="space-y-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs text-gray-400">
              Not a business?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-gray-600 font-medium hover:underline"
              >
                Register as a buyer instead
              </button>
            </p>
          </div>

          {/* Right — form */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {/* Mobile header */}
              <div className="lg:hidden mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white mb-3">
                  <Building2 size={11} />
                  Business Account
                </div>
                <h1 className="text-xl font-bold text-gray-900">Create your business account</h1>
                <p className="text-xs text-gray-500 mt-1">Manage client invitations from one place.</p>
              </div>

              <div className="hidden lg:block mb-5">
                <h2 className="text-lg font-bold text-gray-900">Create your business account</h2>
                <p className="text-xs text-gray-400 mt-0.5">You'll be set up as a Business Account automatically.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business / Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alia Events"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="business@email.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password{" "}
                    <span className="text-gray-400 font-normal">(min. 6 characters)</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
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
                  {loading ? "Creating account..." : "Create Business Account"}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-center text-sm text-gray-500">
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-gray-800 font-medium hover:underline"
                  >
                    Log in
                  </button>
                </p>
                <p className="lg:hidden">
                  Not a business?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-gray-800 font-medium hover:underline"
                  >
                    Register as a buyer
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
