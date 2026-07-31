type DashboardUser = { role?: string | null } | null | undefined;

export function dashboardPathForUser(user: DashboardUser): string {
  if (user?.role === "admin") return "/admin";
  if (user?.role === "business_account") return "/business/dashboard";
  return "/dashboard";
}