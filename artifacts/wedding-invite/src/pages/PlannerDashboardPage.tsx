import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useListPlannerInvitations, useGetMyPlannerProfile } from "@workspace/api-client-react";
import SiteHeader, { type SiteNavItem } from "@/components/SiteHeader";
import SharedNavDrawer from "@/components/SharedNavDrawer";
import SiteFooter from "@/components/SiteFooter";
import { User, LogOut, Calendar, CheckCircle, Clock, Settings, ArrowRight } from "lucide-react";

const NAV_ITEMS: SiteNavItem[] = [
  { label: "HOME", href: "/" },
  { label: "CATALOG", href: "/weddingcards/home" },
  { label: "PRICE LIST", href: "/pricing" },
  { label: "FAQs", href: "/faq" },
  { label: "REVIEWS", href: "/reviews" },
];

export default function PlannerDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      } else if (user.role !== "event_planner") {
        navigate("/dashboard");
      }
    }
  }, [authLoading, user, navigate]);

  const { data: invitations, isLoading: invitationsLoading } = useListPlannerInvitations({
    request: { credentials: "include" },
  });

  const { data: profile } = useGetMyPlannerProfile({
    request: { credentials: "include" },
  });

  if (authLoading || (user && user.role !== "event_planner")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const now = new Date();
  const allInvites = invitations || [];
  
  // Calculate stats based on eventDate
  const upcomingInvites = allInvites.filter((inv) => new Date(inv.eventDate) >= now);
  const pastInvites = allInvites.filter((inv) => new Date(inv.eventDate) < now);

  const stats = [
    { label: "Total Assignments", value: allInvites.length, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Upcoming Events", value: upcomingInvites.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Completed Events", value: pastInvites.length, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="min-h-screen bg-[#Fdfdfc] flex flex-col font-sans">
      <SiteHeader
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        rightSlot={
          <>
            <button
              onClick={() => navigate("/planner/dashboard")}
              title={user.name}
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <User size={18} />
            </button>
            <button
              onClick={handleLogout}
              title="Log Out"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </>
        }
      />

      <SharedNavDrawer
        navItems={NAV_ITEMS}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        drawerFooter={
          <div className="px-5 py-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User size={14} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-900 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        }
      />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-gray-900 mb-2">Planner Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, {profile?.displayName || user.name}. Manage your client invitations.</p>
          </div>
          <button
            onClick={() => navigate("/planner/profile")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Settings size={16} />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Invitations List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Client Invitations</h2>
          </div>
          
          {invitationsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
            </div>
          ) : allInvites.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Calendar size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No invitations assigned yet</p>
              <p className="text-xs text-gray-500 max-w-sm">When clients assign you as their event planner, their invitations will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {allInvites.map((inv) => {
                const eventDateObj = new Date(inv.eventDate);
                const isUpcoming = eventDateObj >= now;
                
                return (
                  <div key={inv.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 justify-between group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {inv.groomName} & {inv.brideName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isUpcoming ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"
                        }`}>
                          {isUpcoming ? "Upcoming" : "Completed"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          {inv.eventType}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          {eventDateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                        {(inv.venueCity || inv.venueState) && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            {[inv.venueCity, inv.venueState].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <a
                      href={`/invite/${inv.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors self-start sm:self-auto"
                    >
                      <span>VIEW INVITE</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
