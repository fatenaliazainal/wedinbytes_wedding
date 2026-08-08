import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Download, LogOut, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import type { SiteNavItem } from "@/components/SiteHeader";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Rsvp = {
  id: number;
  name: string;
  attending: boolean;
  numberOfGuests: number;
  message?: string;
  createdAt: string;
};

type Card = {
  id: number;
  token: string;
  groomName: string;
  brideName: string;
  eventType: string;
  eventDate?: string | null;
  rsvpEnabled: boolean;
  rsvps: Rsvp[];
};

export default function RsvpDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedToken, setSelectedToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    fetch(`${BASE}/api/rsvp/buyer`, { credentials: "include", cache: "no-store" })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Failed to load RSVP data")))
      .then((data: { cards: Card[] }) => {
        setCards(data.cards);
        setSelectedToken((current) => current || data.cards[0]?.token || "");
      })
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [user]);

  const selectedCard = cards.find((card) => card.token === selectedToken) ?? cards[0];
  const totals = useMemo(() => ({
    attending: selectedCard?.rsvps.filter((rsvp) => rsvp.attending).length ?? 0,
    notAttending: selectedCard?.rsvps.filter((rsvp) => !rsvp.attending).length ?? 0,
    guests: selectedCard?.rsvps.reduce((sum, rsvp) => sum + (rsvp.attending ? rsvp.numberOfGuests : 0), 0) ?? 0,
  }), [selectedCard]);

  const exportExcel = () => {
    if (!selectedCard) return;
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Card", "Guest", "Attending", "Guests", "Message", "Submitted"],
      ...selectedCard.rsvps.map((rsvp) => [
        `${selectedCard.groomName} & ${selectedCard.brideName}`,
        rsvp.name,
        rsvp.attending ? "Yes" : "No",
        rsvp.numberOfGuests,
        rsvp.message ?? "",
        new Date(rsvp.createdAt).toLocaleString("en-GB"),
      ]),
    ];
    const csv = "\ufeff" + rows.map((row) => row.map(escape).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rsvp-${selectedCard.groomName}-${selectedCard.brideName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const navItems: SiteNavItem[] = [
    { label: "HOME", href: "/" }, { label: "CATALOG", href: "/weddingcards/home" },
    { label: "PACKAGES", href: "/pricing" }, { label: "FAQs", href: "/faq" }, { label: "REVIEWS", href: "/reviews" },
  ];

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader navItems={navItems} navOpen={navOpen} setNavOpen={setNavOpen} rightSlot={
        <button onClick={async () => { await logout(); navigate("/"); }} className="text-gray-500 hover:text-gray-900" title="Log Out"><LogOut size={18} /></button>
      } />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-5 inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-500 transition-colors hover:text-gray-900"
        >
          <ArrowLeft size={15} />
          BACK TO BUYER DASHBOARD
        </button>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">RSVP Dashboard</h1>
            <p className="text-sm text-gray-500">View guest responses for each invitation card.</p>
          </div>
          <button onClick={exportExcel} disabled={!selectedCard || selectedCard.rsvps.length === 0} className="inline-flex items-center gap-2 rounded bg-gray-900 px-4 py-2 text-xs font-bold tracking-wider text-white disabled:opacity-40">
            <Download size={15} /> EXPORT EXCEL
          </button>
        </div>
        {cards.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">You don't have any invitation cards yet.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-2">
              {cards.map((card) => (
                <button key={card.token} onClick={() => setSelectedToken(card.token)} className={`w-full rounded-lg border p-3 text-left ${selectedCard?.token === card.token ? "border-gray-900 bg-white shadow-sm" : "border-gray-200 bg-white/60"}`}>
                  <p className="truncate text-sm font-semibold">{card.groomName} &amp; {card.brideName}</p>
                  <p className="mt-1 text-xs text-gray-500">{card.rsvps.length} responses</p>
                </button>
              ))}
            </aside>
            <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                <div><h2 className="font-semibold">{selectedCard?.groomName} &amp; {selectedCard?.brideName}</h2><p className="text-xs text-gray-500">{selectedCard?.eventType} · {selectedCard?.eventDate || "No date"}</p></div>
                <Users size={20} className="text-gray-400" />
              </div>
              <div className="grid grid-cols-3 gap-2 py-5 text-center text-sm"><div><b>{totals.attending}</b><p className="text-xs text-gray-500">Attending</p></div><div><b>{totals.notAttending}</b><p className="text-xs text-gray-500">Not attending</p></div><div><b>{totals.guests}</b><p className="text-xs text-gray-500">Total guests</p></div></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b text-xs text-gray-500"><th className="py-2">Guest</th><th>Status</th><th>Guests</th><th>Message</th></tr></thead><tbody>{selectedCard?.rsvps.map((rsvp) => <tr key={rsvp.id} className="border-b border-gray-50"><td className="py-3 font-medium">{rsvp.name}</td><td>{rsvp.attending ? "Attending" : "Not attending"}</td><td>{rsvp.numberOfGuests}</td><td className="max-w-[220px] truncate">{rsvp.message || "—"}</td></tr>)}</tbody></table>{selectedCard?.rsvps.length === 0 && <p className="py-8 text-center text-sm text-gray-400">No RSVP responses yet.</p>}</div>
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}