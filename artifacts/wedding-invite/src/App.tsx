import { Switch, Route, Router as WouterRouter } from "wouter";
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
import DashboardPage from "@/pages/DashboardPage";
import RsvpDashboardPage from "@/pages/RsvpDashboardPage";
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

function AdminEditorRoute() {
  return <EditorPage mode="admin" />;
}

function DemoEditorRoute() {
  return <EditorPage mode="demo" />;
}

function Router() {
  return (
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
      <Route path="/admin/editor" component={AdminEditorRoute} />
      <Route path="/editor" component={EditorRoute} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/rsvp" component={RsvpDashboardPage} />
      <Route path="/business/dashboard" component={BusinessDashboardPage} />
      <Route path="/business/profile" component={BusinessProfilePage} />
      <Route path="/business/editor" component={BusinessEditorRoute} />
      <Route path="/business/:slug/customer-form/:token" component={CustomerFormPage} />
      <Route path="/customer-form/:token" component={CustomerFormPage} />
      <Route path="/payment/toyyibpay/return" component={ToyyibPayReturnPage} />
      <Route path="/business/:slug" component={PublicBusinessProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
