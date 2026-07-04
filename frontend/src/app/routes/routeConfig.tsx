import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { PosLayout } from "../../layouts/PosLayout";
import { PublicLayout } from "../../layouts/PublicLayout";
import { SuperAdminLayout } from "../../layouts/SuperAdminLayout";
import { ActivityLogsPage } from "../../pages/admin/ActivityLogsPage";
import { HelpSupportPage } from "../../pages/admin/HelpSupportPage";
import { SettingsPage } from "../../pages/admin/SettingsPage";
import { SubscriptionBillingPage } from "../../pages/admin/SubscriptionBillingPage";
import { UsersPermissionsPage } from "../../pages/admin/UsersPermissionsPage";
import { OwnerDashboardPage } from "../../pages/dashboard/OwnerDashboardPage";
import { CustomersDebtsPage } from "../../pages/finance/CustomersDebtsPage";
import { ExpensesPage } from "../../pages/finance/ExpensesPage";
import { AiInsightsPage } from "../../pages/insights/AiInsightsPage";
import { NotificationsPage } from "../../pages/insights/NotificationsPage";
import { InventoryPage } from "../../pages/inventory/InventoryPage";
import { OnboardingWizardPage } from "../../pages/onboarding/OnboardingWizardPage";
import { CategoriesPage } from "../../pages/products/CategoriesPage";
import { ProductsPage } from "../../pages/products/ProductsPage";
import { LandingPage } from "../../pages/public/LandingPage";
import { LoginPage } from "../../pages/public/LoginPage";
import { RequestDemoPage } from "../../pages/public/RequestDemoPage";
import { ReportsPage } from "../../pages/reports/ReportsPage";
import { ReturnsRefundsPage } from "../../pages/sales/ReturnsRefundsPage";
import { SalesInvoicesPage } from "../../pages/sales/SalesInvoicesPage";
import { EndOfDayClosingPage } from "../../pages/shifts/EndOfDayClosingPage";
import { ShiftManagementPage } from "../../pages/shifts/ShiftManagementPage";
import { PaymentsPage } from "../../pages/super-admin/PaymentsPage";
import { PlansPage } from "../../pages/super-admin/PlansPage";
import { StoresPage } from "../../pages/super-admin/StoresPage";
import { SuperAdminDashboardPage } from "../../pages/super-admin/SuperAdminDashboardPage";
import { SupportTicketsPage } from "../../pages/super-admin/SupportTicketsPage";
import { PurchaseOrdersPage } from "../../pages/suppliers/PurchaseOrdersPage";
import { SuppliersPage } from "../../pages/suppliers/SuppliersPage";
import { PosPage } from "../../pages/pos/PosPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const routeConfig: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/request-demo", element: <RequestDemoPage /> },
      { path: "/onboarding", element: <OnboardingWizardPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/dashboard", element: <OwnerDashboardPage /> },
          { path: "/shifts", element: <ShiftManagementPage /> },
          { path: "/closing", element: <EndOfDayClosingPage /> },
          { path: "/products", element: <ProductsPage /> },
          { path: "/categories", element: <CategoriesPage /> },
          { path: "/inventory", element: <InventoryPage /> },
          { path: "/sales", element: <SalesInvoicesPage /> },
          { path: "/returns", element: <ReturnsRefundsPage /> },
          { path: "/expenses", element: <ExpensesPage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/suppliers", element: <SuppliersPage /> },
          { path: "/purchase-orders", element: <PurchaseOrdersPage /> },
          { path: "/customers-debts", element: <CustomersDebtsPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/ai-insights", element: <AiInsightsPage /> },
          { path: "/users-permissions", element: <UsersPermissionsPage /> },
          { path: "/activity-logs", element: <ActivityLogsPage /> },
          { path: "/subscription-billing", element: <SubscriptionBillingPage /> },
          { path: "/help", element: <HelpSupportPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [{ element: <PosLayout />, children: [{ path: "/pos", element: <PosPage /> }] }],
  },
  {
    element: <ProtectedRoute superAdminOnly />,
    children: [
      {
        element: <SuperAdminLayout />,
        children: [
          { path: "/super-admin", element: <SuperAdminDashboardPage /> },
          { path: "/super-admin/stores", element: <StoresPage /> },
          { path: "/super-admin/plans", element: <PlansPage /> },
          { path: "/super-admin/payments", element: <PaymentsPage /> },
          { path: "/super-admin/support", element: <SupportTicketsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
