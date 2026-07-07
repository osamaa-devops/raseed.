import {
  Activity,
  BarChart3,
  Bell,
  CheckCircle,
  CreditCard,
  DollarSign,
  HelpCircle,
  Layers,
  Package,
  Receipt,
  RotateCcw,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  UserCheck,
  Users,
  Zap,
  ClipboardList,
  Clock,
  Store,
  LifeBuoy,
  Upload,
  GitBranch,
} from "lucide-react";

export const dashboardNavGroups = [
  {
    label: "العمليات",
    items: [
      { label: "الكاشير", path: "/pos", icon: ShoppingCart },
      { label: "الشيفتات", path: "/shifts", icon: Clock },
      { label: "إغلاق اليوم", path: "/closing", icon: CheckCircle },
    ],
  },
  {
    label: "إدارة المحل",
    items: [
      { label: "المنتجات", path: "/products", icon: Package },
      { label: "التصنيفات", path: "/categories", icon: Tag },
      { label: "المخزون", path: "/inventory", icon: Layers },
      { label: "الاستيراد والتصدير", path: "/import-export", icon: Upload },
      { label: "الموردين", path: "/suppliers", icon: Truck },
      { label: "أوامر الشراء", path: "/purchase-orders", icon: ClipboardList },
      { label: "الفروع", path: "/branches", icon: GitBranch },
    ],
  },
  {
    label: "المالية",
    items: [
      { label: "المبيعات والفواتير", path: "/sales", icon: Receipt },
      { label: "المرتجعات", path: "/returns", icon: RotateCcw },
      { label: "المصاريف", path: "/expenses", icon: DollarSign },
      { label: "العملاء والديون", path: "/customers-debts", icon: UserCheck },
    ],
  },
  {
    label: "التحليلات",
    items: [
      { label: "التقارير", path: "/reports", icon: BarChart3 },
      { label: "التنبيهات", path: "/notifications", icon: Bell },
      { label: "الذكاء والتحليلات", path: "/ai-insights", icon: Zap },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { label: "المستخدمين والصلاحيات", path: "/users-permissions", icon: Users },
      { label: "سجل النشاط", path: "/activity-logs", icon: Activity },
      { label: "الاشتراك والفواتير", path: "/subscription-billing", icon: CreditCard },
      { label: "الإعدادات", path: "/settings", icon: Settings },
    ],
  },
  {
    label: "الدعم",
    items: [
      { label: "المساعدة والدعم", path: "/help", icon: HelpCircle },
      { label: "سيناريو العرض", path: "/demo-script", icon: LifeBuoy },
    ],
  },
];

export const superAdminNav = [
  { label: "لوحة المنصة", path: "/super-admin", icon: Store },
  { label: "المحلات", path: "/super-admin/stores", icon: Store },
  { label: "الخطط", path: "/super-admin/plans", icon: CreditCard },
  { label: "المدفوعات", path: "/super-admin/payments", icon: Receipt },
  { label: "الدعم", path: "/super-admin/support", icon: LifeBuoy },
];
