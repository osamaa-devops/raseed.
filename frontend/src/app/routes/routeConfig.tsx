import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { PosLayout } from "../../layouts/PosLayout";
import { PublicLayout } from "../../layouts/PublicLayout";
import { SuperAdminLayout } from "../../layouts/SuperAdminLayout";
import { ActivityLogsPage } from "../../pages/admin/ActivityLogsPage";
import { DemoScriptPage } from "../../pages/admin/DemoScriptPage";
import { HelpSupportPage } from "../../pages/admin/HelpSupportPage";
import { SettingsPage } from "../../pages/admin/SettingsPage";
import { SubscriptionBlockedPage } from "../../pages/admin/SubscriptionBlockedPage";
import { SubscriptionBillingPage } from "../../pages/admin/SubscriptionBillingPage";
import { UsersPermissionsPage } from "../../pages/admin/UsersPermissionsPage";
import { OwnerDashboardPage } from "../../pages/dashboard/OwnerDashboardPage";
import { CustomersDebtsPage } from "../../pages/finance/CustomersDebtsPage";
import { ExpensesPage } from "../../pages/finance/ExpensesPage";
import { AiInsightsPage } from "../../pages/insights/AiInsightsPage";
import { NotificationsPage } from "../../pages/insights/NotificationsPage";
import { InventoryPage } from "../../pages/inventory/InventoryPage";
import { ImportExportPage } from "../../pages/import-export/ImportExportPage";
import { OnboardingWizardPage } from "../../pages/onboarding/OnboardingWizardPage";
import { ActivationPage } from "../../pages/public/ActivationPage";
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
import { RootRoute } from "./RootRoute";

export const routeConfig: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <RootRoute /> },
      { path: "/landing", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/activate", element: <ActivationPage /> },
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
          { path: "/shifts", element: <ProtectedRoute path="/shifts"><ShiftManagementPage /></ProtectedRoute> },
          { path: "/closing", element: <ProtectedRoute path="/closing"><EndOfDayClosingPage /></ProtectedRoute> },
          { path: "/products", element: <ProtectedRoute path="/products"><ProductsPage /></ProtectedRoute> },
          { path: "/categories", element: <ProtectedRoute path="/categories"><CategoriesPage /></ProtectedRoute> },
          { path: "/inventory", element: <ProtectedRoute path="/inventory"><InventoryPage /></ProtectedRoute> },
          { path: "/import-export", element: <ProtectedRoute path="/import-export"><ImportExportPage /></ProtectedRoute> },
          { path: "/sales", element: <ProtectedRoute path="/sales"><SalesInvoicesPage /></ProtectedRoute> },
          { path: "/returns", element: <ProtectedRoute path="/returns"><ReturnsRefundsPage /></ProtectedRoute> },
          { path: "/expenses", element: <ProtectedRoute path="/expenses"><ExpensesPage /></ProtectedRoute> },
          { path: "/reports", element: <ProtectedRoute path="/reports"><ReportsPage /></ProtectedRoute> },
          { path: "/suppliers", element: <ProtectedRoute path="/suppliers"><SuppliersPage /></ProtectedRoute> },
          { path: "/purchase-orders", element: <ProtectedRoute path="/purchase-orders"><PurchaseOrdersPage /></ProtectedRoute> },
          { path: "/customers-debts", element: <ProtectedRoute path="/customers-debts"><CustomersDebtsPage /></ProtectedRoute> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/ai-insights", element: <AiInsightsPage /> },
          { path: "/users-permissions", element: <ProtectedRoute path="/users-permissions"><UsersPermissionsPage /></ProtectedRoute> },
          { path: "/activity-logs", element: <ProtectedRoute path="/activity-logs"><ActivityLogsPage /></ProtectedRoute> },
          { path: "/subscription-billing", element: <ProtectedRoute path="/subscription-billing"><SubscriptionBillingPage /></ProtectedRoute> },
          { path: "/subscription-blocked", element: <SubscriptionBlockedPage /> },
          { path: "/help", element: <HelpSupportPage /> },
          { path: "/demo-script", element: <DemoScriptPage /> },
          { path: "/settings", element: <ProtectedRoute path="/settings"><SettingsPage /></ProtectedRoute> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [{ element: <PosLayout />, children: [{ path: "/pos", element: <ProtectedRoute path="/pos"><PosPage /></ProtectedRoute> }] }],
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
