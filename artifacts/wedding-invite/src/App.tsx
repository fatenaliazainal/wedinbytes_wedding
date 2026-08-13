import { useEffect, Component, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import InvitationPage from "@/pages/InvitationPage";
import HomePage from "@/pages/HomePage";
import WeddingCardsHomePage from "@/pages/WeddingCardsHomePage";
import WeddingCardDetailPage from "@/pages/WeddingCardDetailPage";
import AdminPage from "@/pages/AdminPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import EditorPage from "@/pages/EditorPage";
import AdminEditorPage from "@/pages/AdminEditorPage";
import DashboardPage from "@/pages/DashboardPage";
import RsvpDashboardPage from "@/pages/RsvpDashboardPage";
import RsvpPublicPage from "@/pages/RsvpPublicPage";
import MarketingHomePage from "@/pages/MarketingHomePage";
import PriceListPage from "@/pages/PriceListPage";
import FaqPage from "@/pages/FaqPage";
import ReviewsPage from "@/pages/ReviewsPage";
import Page2DesignGuidePage from "@/pages/Page2DesignGuidePage";
import BusinessDashboardPage from "@/pages/BusinessDashboardPage";
import BusinessProfilePage from "@/pages/BusinessProfilePage";
import PublicBusinessProfilePage from "@/pages/PublicBusinessProfilePage";
import CustomerFormPage from "@/pages/CustomerFormPage";
import ToyyibPayReturnPage from "@/pages/ToyyibPayReturnPage";
import BillplzReturnPage from "@/pages/BillplzReturnPage";
import BusinessProposalPage from "@/pages/BusinessProposalPage";
import BusinessRegisterPage from "@/pages/BusinessRegisterPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import TermsPage from "@/pages/TermsPage";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center">
          <p className="text-4xl">⚠️</p>
          <h1 className="text-lg font-semibold text-gray-800">Ralat berlaku</h1>
          <p className="text-sm text-gray-500 max-w-xs">Cuba muat semula halaman atau kembali ke laman utama.</p>
          <details className="max-w-sm text-left">
            <summary className="text-xs text-gray-400 cursor-pointer">Butiran ralat</summary>
            <pre className="mt-2 text-[10px] text-red-600 bg-red-50 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap">{this.state.error.message}{"\n"}{this.state.error.stack}</pre>
          </details>
          <div className="flex gap-3">
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="px-5 py-2 rounded-full bg-[#3d5a3e] text-white text-sm font-medium hover:bg-[#2d4330] transition-colors"
            >
              Muat Semula
            </button>
            <a href="/" className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors">
              Laman Utama
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    // Only clear body overflow for non-invitation pages.
    // Invitation page manages its own scroll and BottomSheet manages body overflow;
    // clearing it here would race with BottomSheet's cleanup on those routes.
    if (!location.startsWith("/invite/")) {
      document.body.style.overflow = "";
    }
  }, [location]);

  // Handle BFCache restore (browser back/forward from cached page).
  // If a modal was open when the user navigated away, body overflow may be
  // stuck as "hidden" in the restored snapshot — clear it on pageshow.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) document.body.style.overflow = "";
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return null;
}

function PublicInvitationRoute() {
  return <InvitationPage />;
}

const queryClient = new QueryClient();

function EditorRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <EditorPage mode={user?.role === "business_account" ? "business" : "buyer"} />;
}

function BusinessEditorRoute() {
  return <EditorPage mode="business" />;
}

function DemoEditorRoute() {
  return <AdminEditorPage />;
}

// /admin/editor is now merged into /admin/demo — redirect for backward compat
function AdminEditorRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => { navigate("/admin/demo", { replace: true }); }, [navigate]);
  return null;
}

// Wraps the route Switch so the ErrorBoundary key changes on every navigation.
// This guarantees that even if a component crashes mid-transition the user sees
// the next page cleanly rather than a stuck error screen.
function LocationBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary key={location}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <LocationBoundary>
    <Switch>
      <Route path="/" component={MarketingHomePage} />
      <Route path="/invite" component={HomePage} />
      <Route path="/weddingcards/home" component={WeddingCardsHomePage} />
      <Route path="/weddingcards/home/:slug" component={WeddingCardDetailPage} />
      <Route path="/pricing" component={PriceListPage} />
      <Route path="/faq" component={FaqPage} />
      <Route path="/reviews" component={ReviewsPage} />
      <Route path="/page-2-design-guide" component={Page2DesignGuidePage} />
      <Route path="/invite/:dateCode/:slug" component={PublicInvitationRoute} />
      <Route path="/invite/:token" component={InvitationPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/demo" component={DemoEditorRoute} />
      <Route path="/admin/editor" component={AdminEditorRedirect} />
      <Route path="/editor" component={EditorRoute} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/rsvp" component={RsvpDashboardPage} />
      <Route path="/rsvp-share/:token" component={RsvpPublicPage} />
      <Route path="/business/dashboard" component={BusinessDashboardPage} />
      <Route path="/business/profile" component={BusinessProfilePage} />
      <Route path="/business/editor" component={BusinessEditorRoute} />
      <Route path="/business/:slug/customer-form/:token" component={CustomerFormPage} />
      <Route path="/customer-form/:token" component={CustomerFormPage} />
      <Route path="/payment/toyyibpay/return" component={ToyyibPayReturnPage} />
      <Route path="/payment/billplz/return" component={BillplzReturnPage} />
      <Route path="/for-business" component={BusinessProposalPage} />
      <Route path="/register/business" component={BusinessRegisterPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/business/:slug" component={PublicBusinessProfilePage} />
      <Route component={NotFound} />
    </Switch>
    </LocationBoundary>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "") }>
              <Router />
            </WouterRouter>
            <Toaster position="top-center" />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
