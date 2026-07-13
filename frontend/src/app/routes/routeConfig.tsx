import { lazy } from "react";
import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { PosLayout } from "../../layouts/PosLayout";
import { PublicLayout } from "../../layouts/PublicLayout";
import { SuperAdminLayout } from "../../layouts/SuperAdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RootRoute } from "./RootRoute";

const ActivityLogsPage = lazy(() => import("../../pages/admin/ActivityLogsPage").then((module) => ({ default: module.ActivityLogsPage })));
const BranchesPage = lazy(() => import("../../pages/admin/BranchesPage").then((module) => ({ default: module.BranchesPage })));
const HelpSupportPage = lazy(() => import("../../pages/admin/HelpSupportPage").then((module) => ({ default: module.HelpSupportPage })));
const SettingsPage = lazy(() => import("../../pages/admin/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const SubscriptionBlockedPage = lazy(() => import("../../pages/admin/SubscriptionBlockedPage").then((module) => ({ default: module.SubscriptionBlockedPage })));
const SubscriptionBillingPage = lazy(() => import("../../pages/admin/SubscriptionBillingPage").then((module) => ({ default: module.SubscriptionBillingPage })));
const UsersPermissionsPage = lazy(() => import("../../pages/admin/UsersPermissionsPage").then((module) => ({ default: module.UsersPermissionsPage })));
const OwnerDashboardPage = lazy(() => import("../../pages/dashboard/OwnerDashboardPage").then((module) => ({ default: module.OwnerDashboardPage })));
const CustomersDebtsPage = lazy(() => import("../../pages/finance/CustomersDebtsPage").then((module) => ({ default: module.CustomersDebtsPage })));
const ExpensesPage = lazy(() => import("../../pages/finance/ExpensesPage").then((module) => ({ default: module.ExpensesPage })));
const AiInsightsPage = lazy(() => import("../../pages/insights/AiInsightsPage").then((module) => ({ default: module.AiInsightsPage })));
const NotificationsPage = lazy(() => import("../../pages/insights/NotificationsPage").then((module) => ({ default: module.NotificationsPage })));
const InventoryPage = lazy(() => import("../../pages/inventory/InventoryPage").then((module) => ({ default: module.InventoryPage })));
const ImportExportPage = lazy(() => import("../../pages/import-export/ImportExportPage").then((module) => ({ default: module.ImportExportPage })));
const OnboardingWizardPage = lazy(() => import("../../pages/onboarding/OnboardingWizardPage").then((module) => ({ default: module.OnboardingWizardPage })));
const ActivationPage = lazy(() => import("../../pages/public/ActivationPage").then((module) => ({ default: module.ActivationPage })));
const CategoriesPage = lazy(() => import("../../pages/products/CategoriesPage").then((module) => ({ default: module.CategoriesPage })));
const ProductsPage = lazy(() => import("../../pages/products/ProductsPage").then((module) => ({ default: module.ProductsPage })));
const LandingPage = lazy(() => import("../../pages/public/LandingPage").then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import("../../pages/public/LoginPage").then((module) => ({ default: module.LoginPage })));
const RequestDemoPage = lazy(() => import("../../pages/public/RequestDemoPage").then((module) => ({ default: module.RequestDemoPage })));
const ReportsPage = lazy(() => import("../../pages/reports/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const ReturnsRefundsPage = lazy(() => import("../../pages/sales/ReturnsRefundsPage").then((module) => ({ default: module.ReturnsRefundsPage })));
const SalesInvoicesPage = lazy(() => import("../../pages/sales/SalesInvoicesPage").then((module) => ({ default: module.SalesInvoicesPage })));
const EndOfDayClosingPage = lazy(() => import("../../pages/shifts/EndOfDayClosingPage").then((module) => ({ default: module.EndOfDayClosingPage })));
const ShiftManagementPage = lazy(() => import("../../pages/shifts/ShiftManagementPage").then((module) => ({ default: module.ShiftManagementPage })));
const PaymentsPage = lazy(() => import("../../pages/super-admin/PaymentsPage").then((module) => ({ default: module.PaymentsPage })));
const PlansPage = lazy(() => import("../../pages/super-admin/PlansPage").then((module) => ({ default: module.PlansPage })));
const StoresPage = lazy(() => import("../../pages/super-admin/StoresPage").then((module) => ({ default: module.StoresPage })));
const SuperAdminDashboardPage = lazy(() => import("../../pages/super-admin/SuperAdminDashboardPage").then((module) => ({ default: module.SuperAdminDashboardPage })));
const SupportTicketsPage = lazy(() => import("../../pages/super-admin/SupportTicketsPage").then((module) => ({ default: module.SupportTicketsPage })));
const PurchaseOrdersPage = lazy(() => import("../../pages/suppliers/PurchaseOrdersPage").then((module) => ({ default: module.PurchaseOrdersPage })));
const SuppliersPage = lazy(() => import("../../pages/suppliers/SuppliersPage").then((module) => ({ default: module.SuppliersPage })));
const PosPage = lazy(() => import("../../pages/pos/PosPage").then((module) => ({ default: module.PosPage })));

export const routeConfig: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/start", element: <RootRoute /> },
      { path: "/landing", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/activate", element: <ActivationPage /> },
      { path: "/contact", element: <RequestDemoPage /> },
      { path: "/request-demo", element: <Navigate to="/contact" replace /> },
      { path: "/onboarding", element: <OnboardingWizardPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/dashboard", element: <ProtectedRoute path="/dashboard"><OwnerDashboardPage /></ProtectedRoute> },
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
          { path: "/branches", element: <ProtectedRoute path="/branches"><BranchesPage /></ProtectedRoute> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/ai-insights", element: <AiInsightsPage /> },
          { path: "/users-permissions", element: <ProtectedRoute path="/users-permissions"><UsersPermissionsPage /></ProtectedRoute> },
          { path: "/activity-logs", element: <ProtectedRoute path="/activity-logs"><ActivityLogsPage /></ProtectedRoute> },
          { path: "/subscription-billing", element: <ProtectedRoute path="/subscription-billing"><SubscriptionBillingPage /></ProtectedRoute> },
          { path: "/subscription-blocked", element: <SubscriptionBlockedPage /> },
          { path: "/help", element: <HelpSupportPage /> },
          { path: "/demo-script", element: <Navigate to="/help" replace /> },
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
