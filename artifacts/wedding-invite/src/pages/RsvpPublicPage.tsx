import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { Users } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import type { SiteNavItem } from "@/components/SiteHeader";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Rsvp = {
  id: number;
  name: string;
  attending: boolean;
  numberOfGuests: number;
  timeSlot?: string;
  message?: string;
  createdAt: string;
};

type Invitation = {
  groomName: string;
  brideName: string;
  eventType: string;
  eventDate?: string | null;
};

type PublicRsvpData = {
  invitation: Invitation;
  rsvps: Rsvp[];
};

const navItems: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
];

export default function RsvpPublicPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicRsvpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/api/rsvp/public/${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json() as Promise<PublicRsvpData>;
      })
      .then(setData)
      .catch(() => setError("RSVP data could not be loaded."))
      .finally(() => setLoading(false));
  }, [token]);

  const totals = useMemo(() => ({
    attending: data?.rsvps.filter((r) => r.attending).length ?? 0,
    notAttending: data?.rsvps.filter((r) => !r.attending).length ?? 0,
    guests: data?.rsvps.reduce((sum, r) => sum + (r.attending ? r.numberOfGuests : 0), 0) ?? 0,
  }), [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        {error || "RSVP data not found."}
      </div>
    );
  }

  const { invitation, rsvps } = data;
  const coupleNames = `${invitation.groomName} & ${invitation.brideName}`;
  const subtitle = [invitation.eventType, invitation.eventDate]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SiteHeader navItems={navItems} navOpen={navOpen} setNavOpen={setNavOpen} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">RSVP Responses</h1>
            <p className="mt-1 text-sm text-gray-500">{coupleNames}</p>
            {subtitle && (
              <p className="text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
          <Users size={28} className="text-gray-300" />
        </div>

        {/* Summary tiles */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Attending", value: totals.attending, color: "text-green-600" },
            { label: "Not attending", value: totals.notAttending, color: "text-red-500" },
            { label: "Total guests", value: totals.guests, color: "text-blue-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="mt-1 text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Response table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {rsvps.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-400">
              No RSVP responses yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Time slot</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{rsvp.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          rsvp.attending
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}>
                          {rsvp.attending ? "Attending" : "Not attending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{rsvp.numberOfGuests}</td>
                      <td className="px-4 py-3 text-gray-500">{rsvp.timeSlot || "—"}</td>
                      <td className="max-w-[200px] px-4 py-3 text-gray-500 truncate">{rsvp.message || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(rsvp.createdAt).toLocaleDateString("en-MY", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
