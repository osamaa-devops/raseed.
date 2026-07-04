import { useState, useCallback, useEffect, useRef } from "react";
import { toast, Toaster } from "sonner";
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Users, Settings,
  Bell, ChevronDown, Search, Plus, Printer, RotateCcw, X, Check,
  TrendingUp, TrendingDown, AlertTriangle, Clock, DollarSign,
  FileText, Truck, UserCheck, Star, LogOut, ArrowLeft,
  CreditCard, Wallet, Banknote, Eye, Edit2, Trash2, Filter,
  Download, Upload, ChevronRight, ChevronLeft,
  ShieldCheck, HelpCircle, Zap, Tag, Calendar, Building2,
  Layers, Activity, MessageSquare, Globe, Lock,
  CheckCircle, XCircle, AlertCircle, Info, Minus, Hash,
  Phone, Briefcase, Award, PieChart, List,
  MoreVertical, ArrowUpRight, ArrowDownRight, Box, Store,
  BarChart2, Percent, Receipt, ClipboardList,
  Smartphone, Monitor, Cpu, BookOpen, Video, Menu,
  ChevronUp, Folder, UserCog, Sun, Moon
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type View =
  | "landing" | "login" | "register" | "onboarding"
  | "dashboard" | "pos" | "shifts" | "end-of-day"
  | "products" | "categories" | "inventory" | "sales" | "returns"
  | "expenses" | "reports" | "suppliers" | "purchase-orders"
  | "customers" | "notifications" | "ai-insights" | "users"
  | "activity-log" | "subscription" | "help" | "settings" | "super-admin";

type UserRole = "owner" | "manager" | "cashier" | "inventory" | "superadmin";

interface AppState {
  view: View; role: UserRole; isOnline: boolean;
  currentBranch: string; userName: string;
  darkMode: boolean; invoiceCounter: number;
}

interface Product {
  id: number; name: string; barcode: string; category: string;
  price: number; cost: number; stock: number; minStock: number;
  unit: string; supplier: string; status: "active" | "inactive"; expiry?: string;
}
interface CartItem { product: Product; qty: number; discount: number; }

type ThemePreference = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "raseed-theme";
const LEGACY_DARK_STORAGE_KEY = "raseed-dark-mode";

function getInitialDarkMode() {
  const theme = localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null;
  const legacyDark = localStorage.getItem(LEGACY_DARK_STORAGE_KEY);

  if (theme === "dark") return true;
  if (theme === "light") return false;
  if (theme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;

  return legacyDark === "true";
}

function applyThemePreference(darkMode: boolean) {
  document.documentElement.classList.toggle("dark", darkMode);
  localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
  localStorage.setItem(LEGACY_DARK_STORAGE_KEY, String(darkMode));
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const BRANCHES = ["الفرع الرئيسي", "فرع الحي الأول"];

const PRODUCTS: Product[] = [
  { id: 1, name: "لبن جهينة", barcode: "6223001234567", category: "ألبان", price: 18, cost: 13, stock: 48, minStock: 20, unit: "كرتونة", supplier: "شركة النور", status: "active", expiry: "2025-08-15" },
  { id: 2, name: "سكر أبيض", barcode: "6223001234568", category: "بقالة", price: 35, cost: 28, stock: 120, minStock: 30, unit: "كيلو", supplier: "مورد المدينة", status: "active" },
  { id: 3, name: "أرز مصري", barcode: "6223001234569", category: "بقالة", price: 45, cost: 35, stock: 8, minStock: 25, unit: "كيلو", supplier: "مورد المدينة", status: "active" },
  { id: 4, name: "زيت خليط", barcode: "6223001234570", category: "بقالة", price: 55, cost: 42, stock: 60, minStock: 15, unit: "لتر", supplier: "شركة الأمل", status: "active" },
  { id: 5, name: "شاي العروسة", barcode: "6223001234571", category: "بقالة", price: 22, cost: 16, stock: 90, minStock: 20, unit: "علبة", supplier: "شركة الأمل", status: "active" },
  { id: 6, name: "مياه معدنية", barcode: "6223001234572", category: "مشروبات", price: 5, cost: 3, stock: 200, minStock: 50, unit: "عبوة", supplier: "شركة النور", status: "active" },
  { id: 7, name: "جبنة بيضاء", barcode: "6223001234573", category: "ألبان", price: 65, cost: 50, stock: 12, minStock: 15, unit: "كيلو", supplier: "شركة النور", status: "active", expiry: "2025-07-20" },
  { id: 8, name: "مكرونة", barcode: "6223001234574", category: "بقالة", price: 12, cost: 9, stock: 150, minStock: 40, unit: "كيس", supplier: "مورد المدينة", status: "active" },
  { id: 9, name: "بسكويت", barcode: "6223001234575", category: "بقالة", price: 8, cost: 6, stock: 5, minStock: 30, unit: "علبة", supplier: "شركة الأمل", status: "active", expiry: "2025-09-01" },
  { id: 10, name: "مسحوق غسيل", barcode: "6223001234576", category: "منظفات", price: 42, cost: 32, stock: 35, minStock: 10, unit: "كيلو", supplier: "مورد المدينة", status: "active" },
  { id: 11, name: "عصير مانجو", barcode: "6223001234577", category: "مشروبات", price: 15, cost: 10, stock: 70, minStock: 20, unit: "علبة", supplier: "شركة النور", status: "active" },
  { id: 12, name: "بيبسي", barcode: "6223001234578", category: "مشروبات", price: 10, cost: 7, stock: 144, minStock: 48, unit: "علبة", supplier: "شركة الأمل", status: "active" },
  { id: 13, name: "زبادي", barcode: "6223001234579", category: "ألبان", price: 6, cost: 4, stock: 24, minStock: 12, unit: "كوب", supplier: "شركة النور", status: "active", expiry: "2025-07-10" },
  { id: 14, name: "تونة", barcode: "6223001234580", category: "معلبات", price: 20, cost: 14, stock: 80, minStock: 24, unit: "علبة", supplier: "مورد المدينة", status: "active" },
  { id: 15, name: "صابون", barcode: "6223001234581", category: "منظفات", price: 14, cost: 9, stock: 60, minStock: 20, unit: "قطعة", supplier: "شركة الأمل", status: "active" },
];

const SALES_DATA = [
  { day: "السبت", sales: 4200, profit: 1100 },
  { day: "الأحد", sales: 3800, profit: 980 },
  { day: "الاثنين", sales: 5100, profit: 1350 },
  { day: "الثلاثاء", sales: 4700, profit: 1220 },
  { day: "الأربعاء", sales: 6200, profit: 1680 },
  { day: "الخميس", sales: 7100, profit: 1900 },
  { day: "الجمعة", sales: 8500, profit: 2300 },
];

const TOP_PRODUCTS = [
  { name: "لبن جهينة", sales: 340 },
  { name: "مياه معدنية", sales: 290 },
  { name: "بيبسي", sales: 210 },
  { name: "أرز مصري", sales: 185 },
  { name: "سكر أبيض", sales: 160 },
];

const INVOICES = [
  { id: "INV-0891", customer: "محمد علي", cashier: "أحمد", total: 187, method: "كاش", status: "مدفوعة", time: "10:32", items: 6 },
  { id: "INV-0892", customer: "—", cashier: "محمود", total: 63, method: "كارت", status: "مدفوعة", time: "11:05", items: 3 },
  { id: "INV-0893", customer: "أحمد حسن", cashier: "أحمد", total: 240, method: "كاش", status: "مدفوعة", time: "11:44", items: 9 },
  { id: "INV-0894", customer: "—", cashier: "محمود", total: 95, method: "محفظة", status: "مسترجعة", time: "12:10", items: 4 },
  { id: "INV-0895", customer: "مصطفى السيد", cashier: "أحمد", total: 330, method: "كاش", status: "مدفوعة", time: "13:22", items: 12 },
];

const CATEGORIES = [
  { id: 1, name: "ألبان", color: "#0f766e", count: 3, active: true },
  { id: 2, name: "بقالة", color: "#d97706", count: 6, active: true },
  { id: 3, name: "مشروبات", color: "#2563eb", count: 3, active: true },
  { id: 4, name: "منظفات", color: "#7c3aed", count: 2, active: true },
  { id: 5, name: "مجمدات", color: "#0891b2", count: 0, active: false },
  { id: 6, name: "معلبات", color: "#dc2626", count: 1, active: true },
];

const SUPPLIERS = [
  { id: 1, name: "شركة النور للتوريدات", phone: "01001234567", city: "القاهرة", balance: -1200, products: 6, status: "active" },
  { id: 2, name: "مورد المدينة", phone: "01112345678", city: "الجيزة", balance: 0, products: 5, status: "active" },
  { id: 3, name: "شركة الأمل للمواد الغذائية", phone: "01223456789", city: "الإسكندرية", balance: -450, products: 4, status: "active" },
];

const CUSTOMERS = [
  { id: 1, name: "محمد علي", phone: "01001111111", debt: 350, points: 120, lastVisit: "2024-07-03", invoices: 18 },
  { id: 2, name: "أحمد حسن", phone: "01002222222", debt: 0, points: 85, lastVisit: "2024-07-04", invoices: 12 },
  { id: 3, name: "مصطفى السيد", phone: "01003333333", debt: 120, points: 200, lastVisit: "2024-07-02", invoices: 25 },
];

const EXPENSES = [
  { id: 1, name: "كهرباء الشهر", category: "كهرباء", amount: 650, date: "2024-07-01", cashier: "أحمد", branch: "الفرع الرئيسي" },
  { id: 2, name: "صيانة ثلاجة", category: "صيانة", amount: 300, date: "2024-07-02", cashier: "محمود", branch: "الفرع الرئيسي" },
  { id: 3, name: "مواصلات توصيل", category: "توصيل", amount: 120, date: "2024-07-03", cashier: "أحمد", branch: "فرع الحي الأول" },
];

const NOTIFICATIONS = [
  { id: 1, type: "warning", title: "مخزون منخفض", body: "أرز مصري — متبقي 8 وحدات فقط", time: "منذ ساعة", read: false },
  { id: 2, type: "danger", title: "قرب انتهاء الصلاحية", body: "جبنة بيضاء — تنتهي 20 يوليو", time: "منذ ساعتين", read: false },
  { id: 3, type: "info", title: "تم إغلاق الشيفت", body: "أحمد — إجمالي مبيعات 4,200 ج", time: "أمس", read: true },
  { id: 4, type: "success", title: "طلب شراء واصل", body: "شركة النور — 6 منتجات", time: "أمس", read: true },
  { id: 5, type: "warning", title: "اشتراكك ينتهي قريبًا", body: "خطة Pro — تنتهي 31 يوليو", time: "منذ 3 أيام", read: true },
];

const USERS = [
  { id: 1, name: "أحمد محمود", role: "cashier", phone: "01001234560", branch: "الفرع الرئيسي", lastLogin: "منذ ساعة", status: "active" },
  { id: 2, name: "محمود سامي", role: "cashier", phone: "01001234561", branch: "فرع الحي الأول", lastLogin: "منذ 3 ساعات", status: "active" },
  { id: 3, name: "سارة خالد", role: "inventory", phone: "01001234562", branch: "الفرع الرئيسي", lastLogin: "أمس", status: "active" },
  { id: 4, name: "محمد ناصر", role: "manager", phone: "01001234563", branch: "الكل", lastLogin: "منذ يومين", status: "inactive" },
];

const ACTIVITY_LOG = [
  { id: 1, user: "أحمد", action: "إضافة منتج", detail: "لبن جهينة — 24 كرتونة", time: "10:32", date: "اليوم", branch: "الفرع الرئيسي" },
  { id: 2, user: "محمود", action: "استرجاع فاتورة", detail: "INV-0894 — 95 ج", time: "12:10", date: "اليوم", branch: "فرع الحي الأول" },
  { id: 3, user: "سارة", action: "تعديل مخزون", detail: "أرز مصري — من 15 إلى 8", time: "09:15", date: "اليوم", branch: "الفرع الرئيسي" },
  { id: 4, user: "محمود", action: "إغلاق شيفت", detail: "مبيعات 3,800 ج — فرق 0 ج", time: "22:00", date: "أمس", branch: "فرع الحي الأول" },
];

// ─── Design System ────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    yellow: "bg-amber-50 text-amber-700 border border-amber-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    gray: "bg-gray-100 text-gray-600 border border-gray-200",
    purple: "bg-violet-50 text-violet-700 border border-violet-200",
    teal: "bg-teal-50 text-teal-700 border border-teal-200",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${map[color] || map.gray}`}>{label}</span>;
}

function KpiCard({ title, value, sub, icon: Icon, trend, trendVal, iconBg }: {
  title: string; value: string; sub?: string; icon: React.ElementType;
  trend?: "up" | "down"; trendVal?: string; iconBg: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon size={18} />
        </div>
        {trend && trendVal && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {trend === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trendVal}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {sub && <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

function Btn({ children, variant = "primary", size = "md", onClick, className = "", icon: Icon, disabled, type = "button" }: {
  children?: React.ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
  size?: "sm" | "md" | "lg"; onClick?: () => void; className?: string;
  icon?: React.ElementType; disabled?: boolean; type?: "button" | "submit";
}) {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    outline: "border border-border bg-card text-foreground hover:bg-muted shadow-sm",
  };
  return (
    <button type={type} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} onClick={onClick} disabled={disabled}>
      {Icon && <Icon size={size === "sm" ? 13 : 15} />}
      {children}
    </button>
  );
}

function Input({ placeholder, value, onChange, type = "text", className = "", label }: {
  placeholder?: string; value?: string; onChange?: (v: string) => void;
  type?: string; className?: string; label?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>}
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
    </div>
  );
}

function Select({ label, children, value, onChange, className = "" }: {
  label?: string; children: React.ReactNode; value?: string; onChange?: (v: string) => void; className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>}
      <select
        value={value} onChange={e => onChange?.(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      >
        {children}
      </select>
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div
        className={`relative bg-card rounded-2xl shadow-2xl border border-border ${wide ? "w-full max-w-2xl" : "w-full max-w-md"} max-h-[92vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground text-base">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, body, danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; body?: string; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-100" : "bg-amber-100"}`}>
            <AlertTriangle size={22} className={danger ? "text-red-600" : "text-amber-600"} />
          </div>
          <h3 className="font-bold text-foreground text-center mb-1">{title}</h3>
          {body && <p className="text-sm text-muted-foreground text-center mb-5">{body}</p>}
          {!body && <div className="mb-5" />}
          <div className="flex gap-2">
            <Btn variant="outline" className="flex-1 justify-center" onClick={onClose}>إلغاء</Btn>
            <Btn variant={danger ? "danger" : "primary"} className="flex-1 justify-center" onClick={() => { onConfirm(); onClose(); }}>تأكيد</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, action }: { icon: React.ElementType; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon size={28} className="text-muted-foreground opacity-50" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      {sub && <p className="text-sm text-muted-foreground mb-4">{sub}</p>}
      {action}
    </div>
  );
}

function AlertBanner({ type, title, body }: { type: "success" | "warning" | "danger" | "info"; title: string; body?: string }) {
  const styles = {
    success: { bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle, ic: "text-emerald-600", text: "text-emerald-800" },
    warning: { bg: "bg-amber-50 border-amber-200", icon: AlertTriangle, ic: "text-amber-600", text: "text-amber-800" },
    danger: { bg: "bg-red-50 border-red-200", icon: XCircle, ic: "text-red-600", text: "text-red-800" },
    info: { bg: "bg-blue-50 border-blue-200", icon: Info, ic: "text-blue-600", text: "text-blue-800" },
  };
  const s = styles[type];
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${s.bg}`}>
      <s.icon size={16} className={`${s.ic} mt-0.5 flex-shrink-0`} />
      <div>
        <p className={`font-semibold text-sm ${s.text}`}>{title}</p>
        {body && <p className={`text-xs mt-0.5 ${s.text} opacity-80`}>{body}</p>}
      </div>
    </div>
  );
}

// ─── Role-Based Access ────────────────────────────────────────────────────────
const ROLE_VIEWS: Record<UserRole, View[]> = {
  superadmin: ["super-admin"],
  owner: [
    "dashboard","pos","shifts","end-of-day","products","categories","inventory",
    "sales","returns","expenses","reports","suppliers","purchase-orders",
    "customers","notifications","ai-insights","users","activity-log",
    "subscription","help","settings",
  ],
  manager: [
    "dashboard","pos","shifts","end-of-day","products","categories","inventory",
    "sales","returns","expenses","reports","suppliers","purchase-orders",
    "customers","notifications","ai-insights","users","activity-log","help",
  ],
  cashier: ["pos","shifts","notifications","help"],
  inventory: ["inventory","products","categories","suppliers","purchase-orders","notifications","help"],
};

const ROLE_HOME: Record<UserRole, View> = {
  superadmin: "super-admin", owner: "dashboard", manager: "dashboard",
  cashier: "pos", inventory: "inventory",
};

const SUPER_ADMIN_NAV = [
  { label: "المنصة", items: [
    { id: "super-admin", label: "لوحة المنصة", icon: LayoutDashboard },
  ]},
];

// ─── Sidebar (Grouped Navigation) ─────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "العمليات",
    items: [
      { id: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
      { id: "pos", label: "الكاشير", icon: ShoppingCart },
      { id: "shifts", label: "الشيفتات", icon: Clock },
      { id: "end-of-day", label: "إغلاق اليوم", icon: CheckCircle },
    ],
  },
  {
    label: "إدارة المحل",
    items: [
      { id: "products", label: "المنتجات", icon: Package },
      { id: "categories", label: "التصنيفات", icon: Tag },
      { id: "inventory", label: "المخزون", icon: Layers },
      { id: "suppliers", label: "الموردين", icon: Truck },
      { id: "purchase-orders", label: "أوامر الشراء", icon: ClipboardList },
    ],
  },
  {
    label: "المالية",
    items: [
      { id: "sales", label: "المبيعات والفواتير", icon: Receipt },
      { id: "returns", label: "المرتجعات", icon: RotateCcw },
      { id: "expenses", label: "المصاريف", icon: DollarSign },
      { id: "customers", label: "العملاء والديون", icon: UserCheck },
    ],
  },
  {
    label: "التحليلات",
    items: [
      { id: "reports", label: "التقارير", icon: BarChart3 },
      { id: "notifications", label: "التنبيهات", icon: Bell },
      { id: "ai-insights", label: "الذكاء والتحليلات", icon: Zap },
    ],
  },
  {
    label: "الإدارة",
    items: [
      { id: "users", label: "المستخدمين", icon: Users },
      { id: "activity-log", label: "سجل النشاط", icon: Activity },
      { id: "subscription", label: "الاشتراك", icon: CreditCard },
      { id: "settings", label: "الإعدادات", icon: Settings },
    ],
  },
  {
    label: "الدعم",
    items: [
      { id: "help", label: "المساعدة والدعم", icon: HelpCircle },
    ],
  },
];

function Sidebar({ current, onNav, collapsed, onToggle, onLogout, role }: {
  current: View; onNav: (v: View) => void; collapsed: boolean; onToggle: () => void;
  onLogout: () => void; role: UserRole;
}) {
  const unread = NOTIFICATIONS.filter(n => !n.read).length;
  const allowed = ROLE_VIEWS[role];

  const groups = role === "superadmin"
    ? SUPER_ADMIN_NAV
    : NAV_GROUPS
        .map(g => ({ ...g, items: g.items.filter(i => allowed.includes(i.id as View)) }))
        .filter(g => g.items.length > 0);

  const roleLabel: Record<UserRole, string> = {
    owner: "صاحب المحل", manager: "مدير", cashier: "كاشير",
    inventory: "موظف مخزون", superadmin: "سوبر أدمن",
  };
  const roleBadgeColor: Record<UserRole, string> = {
    owner: "bg-teal-500/20 text-teal-300", manager: "bg-blue-500/20 text-blue-300",
    cashier: "bg-emerald-500/20 text-emerald-300", inventory: "bg-amber-500/20 text-amber-300",
    superadmin: "bg-violet-500/20 text-violet-300",
  };

  return (
    <aside
      className={`fixed top-0 right-0 h-full z-30 flex flex-col transition-all duration-300 select-none ${collapsed ? "w-16" : "w-60"}`}
      style={{ background: "var(--sidebar)", borderLeft: "1px solid var(--sidebar-border)" }}
    >
      {/* Logo row */}
      <div className="flex items-center h-14 px-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">ر</div>
        {!collapsed && <span className="font-bold text-white text-base mr-2.5 flex-1">رصيد</span>}
        <button onClick={onToggle} className="p-1 rounded text-slate-400 hover:text-white cursor-pointer transition-colors ml-auto">
          {collapsed ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-2 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeColor[role]}`}>
            {roleLabel[role]}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
        {groups.map(group => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">{group.label}</p>
            )}
            {group.items.map(item => {
              const active = current === item.id;
              const isNotif = item.id === "notifications";
              return (
                <button
                  key={item.id}
                  onClick={() => onNav(item.id as View)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 transition-all cursor-pointer relative
                    ${collapsed ? "justify-center px-0 py-2.5 mx-auto" : "px-4 py-2 text-sm"}
                    ${active
                      ? "bg-primary/20 text-white font-medium"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                >
                  {active && <span className="absolute right-0 top-1 bottom-1 w-0.5 bg-primary rounded-l" />}
                  <item.icon size={17} className={active ? "text-primary" : ""} />
                  {!collapsed && <span className="flex-1 text-right">{item.label}</span>}
                  {!collapsed && isNotif && unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">{unread}</span>
                  )}
                  {collapsed && isNotif && unread > 0 && (
                    <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              );
            })}
            {!collapsed && <div className="mx-4 mt-1 mb-1 border-b" style={{ borderColor: "var(--sidebar-border)" }} />}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <button onClick={onLogout} className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer ${collapsed ? "justify-center" : ""}`}>
          <LogOut size={16} />
          {!collapsed && <span className="text-sm">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}

function TopBar({ branch, onBranchChange, isOnline, userName, onNav, sidebarWidth, darkMode, onToggleDark, onMenuToggle, isMobile }: {
  branch: string; onBranchChange: (b: string) => void; isOnline: boolean;
  userName: string; onNav: (v: View) => void; sidebarWidth: number;
  darkMode: boolean; onToggleDark: () => void; onMenuToggle: () => void; isMobile: boolean;
}) {
  const unread = NOTIFICATIONS.filter(n => !n.read).length;
  return (
    <header
      className="fixed top-0 left-0 h-14 bg-card border-b border-border z-20 flex items-center px-4 gap-3"
      style={{ right: isMobile ? 0 : sidebarWidth }}
    >
      {isMobile && (
        <button onClick={onMenuToggle} className="p-2 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground transition-colors">
          <Menu size={18} />
        </button>
      )}
      <div className="flex items-center gap-1.5 text-sm">
        <Store size={14} className="text-muted-foreground" />
        <span className="font-semibold text-foreground">ماركت المدينة</span>
        <span className="text-muted-foreground">/</span>
        <select
          value={branch} onChange={e => onBranchChange(e.target.value)}
          className="text-sm bg-transparent border-none outline-none text-muted-foreground cursor-pointer hover:text-foreground"
        >
          {BRANCHES.map(b => <option key={b}>{b}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-1.5 mr-auto">
        <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
        <span className="text-xs text-muted-foreground">{isOnline ? "متصل" : "غير متصل"}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={onToggleDark} className="p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors" title={darkMode ? "وضع نهاري" : "وضع مظلم"}>
          {darkMode ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} className="text-muted-foreground" />}
        </button>
        <button
          onClick={() => onNav("notifications")}
          className="relative p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
        >
          <Bell size={17} className="text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>
          )}
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
            {userName[0]}
          </div>
          <span className="text-sm font-medium text-foreground">{userName}</span>
          <ChevronDown size={13} className="text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onNav }: { onNav: (v: View) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const benefits = [
    { icon: Hash, title: "بيع أسرع بالباركود", desc: "امسح الباركود وأتم البيع في ثوانٍ بدون أخطاء" },
    { icon: Layers, title: "متابعة المخزون لحظة بلحظة", desc: "تنبيهات فورية عند نقص أي منتج" },
    { icon: TrendingUp, title: "تقارير أرباح واضحة", desc: "اعرف ربحك اليومي والشهري بضغطة واحدة" },
    { icon: Users, title: "صلاحيات للموظفين", desc: "كل موظف يرى ويعمل ما يخصه فقط" },
    { icon: Printer, title: "فواتير وطباعة فورية", desc: "فواتير احترافية وطباعة فورية للعميل" },
    { icon: Smartphone, title: "متابعة من الموبايل", desc: "راقب محلك من أي مكان في أي وقت" },
    { icon: Store, title: "مناسب لأكثر من نوع محل", desc: "سوبر ماركت، صيدلية، إلكترونيات، وأكثر" },
    { icon: Globe, title: "يعمل أون وأوف لاين", desc: "لا توقف حتى لو انقطع الإنترنت" },
  ];

  const pricing = [
    { name: "أساسي", price: 199, features: ["كاشير واحد", "حتى 500 منتج", "فرع واحد", "تقارير أساسية"] },
    { name: "Pro", price: 399, features: ["3 كاشيرين", "منتجات غير محدودة", "فرعين", "تقارير متقدمة", "ذكاء اصطناعي"], popular: true },
    { name: "Business", price: 699, features: ["10 كاشيرين", "منتجات غير محدودة", "5 فروع", "كل التقارير", "دعم أولوية"] },
    { name: "Enterprise", price: 0, features: ["كاشيرين غير محدودين", "فروع غير محدودة", "API مخصص", "دعم VIP 24/7"] },
  ];

  const faqs = [
    { q: "هل يعمل بدون إنترنت؟", a: "نعم، رصيد يعمل أوف لاين بالكامل ويتزامن تلقائيًا عند الاتصال." },
    { q: "كيف أنقل بياناتي من النظام القديم؟", a: "نوفر استيراد Excel بسيط للمنتجات والعملاء، وفريقنا يساعدك مجانًا." },
    { q: "هل هناك تجربة مجانية؟", a: "نعم، 14 يومًا مجانًا بدون بيانات بنكية وبدون أي التزام." },
    { q: "ما الطابعات المدعومة؟", a: "ندعم طابعات الإيصالات الحرارية والطابعات العادية عبر USB وشبكة." },
    { q: "هل يمكنني استخدامه على أكثر من جهاز؟", a: "نعم، يعمل على جميع الأجهزة في نفس الوقت — كمبيوتر، تابلت، وموبايل." },
  ];

  return (
    <div className="min-h-screen bg-white text-foreground font-[Noto_Sans_Arabic,sans-serif]" dir="rtl">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">ر</div>
            <span className="font-bold text-lg text-foreground">رصيد</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#benefits" className="hover:text-foreground transition-colors">المميزات</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">الأسعار</a>
            <a href="#faq" className="hover:text-foreground transition-colors">الأسئلة</a>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="sm" onClick={() => onNav("login")}>تسجيل الدخول</Btn>
            <Btn size="sm" onClick={() => onNav("register")}>تجربة مجانية</Btn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-full text-xs font-medium mb-6">
            <Zap size={12} /> نظام POS عربي للسوبر ماركت والمحلات
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-5">
            نظام كاشير ومخزون ذكي<br />
            <span className="text-primary">للسوبر ماركت والمحلات</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            تابع مبيعاتك، مخزونك، أرباحك، وموظفينك من مكان واحد.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <Btn size="lg" onClick={() => onNav("register")}>اطلب تجربة مجانية</Btn>
            <Btn size="lg" variant="outline" onClick={() => onNav("login")}>شاهد العرض التوضيحي</Btn>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            {["14 يوم مجانًا", "بدون بيانات بنكية", "دعم فوري"].map(f => (
              <span key={f} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-primary" /> {f}
              </span>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div className="bg-input-background rounded-2xl border border-border p-1 shadow-xl">
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="bg-[#1a2332] px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-slate-400 text-xs mr-2">ماركت المدينة — لوحة التحكم</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "مبيعات اليوم", val: "8,500 ج", up: true },
                  { label: "صافي الربح", val: "2,300 ج", up: true },
                  { label: "عدد الفواتير", val: "47 فاتورة", up: false },
                  { label: "مخزون منخفض", val: "3 منتجات", up: false },
                ].map(c => (
                  <div key={c.label} className="bg-input-background rounded-xl p-3">
                    <p className="text-[11px] text-gray-500">{c.label}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{c.val}</p>
                  </div>
                ))}
              </div>
              <div className="bg-input-background rounded-xl p-3 h-24 flex items-end gap-1 justify-around">
                {SALES_DATA.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-5 rounded-t" style={{ height: d.sales / 120, background: "#0f766e", opacity: 0.7 + i * 0.04 }} />
                    <span className="text-[9px] text-gray-400">{d.day.slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="bg-input-background border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">كل اللي محلك محتاجه</h2>
            <p className="text-muted-foreground">نظام واحد يغني عن عشرين</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map(b => (
              <div key={b.title} className="bg-white p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center mb-3">
                  <b.icon size={18} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">أجهزة مدعومة</h2>
          <p className="text-muted-foreground">يعمل مع أكثر الأجهزة شيوعًا في السوق المصري</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {["ماسح باركود", "طابعة إيصالات", "درج نقود", "طابعة باركود", "شاشة لمس", "ميزان إلكتروني"].map(h => (
            <div key={h} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-foreground hover:border-primary/30 transition-all">
              <Monitor size={14} className="text-primary" /> {h}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-input-background border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-2">اختار الخطة المناسبة</h2>
            <p className="text-muted-foreground">جميع الخطط تشمل التدريب والدعم الفني</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {pricing.map(p => (
              <div key={p.name} className={`bg-white rounded-xl border-2 p-5 flex flex-col relative ${p.popular ? "border-primary shadow-lg" : "border-border"}`}>
                {p.popular && (
                  <div className="absolute -top-3 right-4 bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">الأشهر</div>
                )}
                <h3 className="font-bold text-foreground mb-2">{p.name}</h3>
                <div className="mb-5">
                  {p.price > 0
                    ? <><span className="text-3xl font-extrabold text-foreground">{p.price}</span><span className="text-sm text-muted-foreground"> ج/شهر</span></>
                    : <span className="text-lg font-semibold text-muted-foreground">تواصل معنا</span>
                  }
                </div>
                <ul className="flex-1 space-y-2 mb-5">
                  {p.features.map(f => (
                    <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                      <Check size={12} className="text-primary flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Btn variant={p.popular ? "primary" : "outline"} className="w-full justify-center" onClick={() => onNav("register")}>
                  {p.price === 0 ? "تواصل معنا" : "ابدأ الآن"}
                </Btn>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">أسئلة شائعة</h2>
        </div>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
              <button
                className="w-full text-right px-5 py-4 flex items-center justify-between text-foreground font-medium cursor-pointer hover:bg-input-background transition-colors text-sm"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {f.q}
                <ChevronDown size={15} className={`text-muted-foreground transition-transform flex-shrink-0 mr-3 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="max-w-lg mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">جاهز تبدأ؟</h2>
          <p className="text-primary-foreground/80 mb-8">اطلب تجربة مجانية 14 يوم — بدون بيانات بنكية</p>
          <button
            onClick={() => onNav("register")}
            className="bg-white text-primary font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            ابدأ تجربتك المجانية
          </button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground bg-white">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">ر</div>
          <span className="font-bold text-foreground">رصيد</span>
        </div>
        <p>مبيعاتك، مخزونك، وأرباحك في مكان واحد.</p>
        <p className="mt-1">© 2024 رصيد. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onNav, onLogin }: { onNav: (v: View) => void; onLogin: (role: UserRole) => void }) {
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  return (
    <div className="min-h-screen bg-input-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">ر</div>
          <h1 className="text-xl font-bold text-foreground">تسجيل الدخول</h1>
          <p className="text-sm text-muted-foreground mt-1">مرحبًا بك في رصيد</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <Input label="رقم الهاتف أو البريد" placeholder="01xxxxxxxxx" value={phone} onChange={setPhone} />
          <Input label="كلمة المرور" type="password" placeholder="••••••••" value={pass} onChange={setPass} />
          <Select label="الدور" value={role} onChange={v => setRole(v as UserRole)}>
            <option value="owner">صاحب المحل</option>
            <option value="manager">مدير</option>
            <option value="cashier">كاشير</option>
            <option value="inventory">موظف مخزون</option>
            <option value="superadmin">سوبر أدمن</option>
          </Select>
          <Btn className="w-full justify-center" size="lg" onClick={() => onLogin(role)}>دخول</Btn>
          <div className="text-center">
            <button className="text-xs text-primary hover:underline cursor-pointer">نسيت كلمة المرور؟</button>
          </div>
        </div>
        <div className="text-center mt-4 text-sm text-muted-foreground">
          محل جديد؟{" "}
          <button onClick={() => onNav("register")} className="text-primary font-medium hover:underline cursor-pointer">اطلب تجربة مجانية</button>
        </div>
        <div className="text-center mt-2">
          <button onClick={() => onNav("landing")} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">← الرجوع للموقع</button>
        </div>
      </div>
    </div>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────
function RegisterPage({ onNav }: { onNav: (v: View) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ storeName: "", ownerName: "", phone: "", storeType: "", branches: "1", cashiers: "1", city: "", time: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  if (submitted) return (
    <div className="min-h-screen bg-input-background flex items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-sm bg-card rounded-2xl border border-border p-8 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">تم استقبال طلبك!</h2>
        <p className="text-muted-foreground mb-6 text-sm">سيتواصل معك فريقنا خلال 24 ساعة على رقم {form.phone}</p>
        <Btn className="mx-auto" onClick={() => onNav("login")}>تسجيل الدخول</Btn>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-input-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">ر</div>
          <h1 className="text-xl font-bold text-foreground">اطلب تجربة مجانية</h1>
          <p className="text-sm text-muted-foreground">14 يوم مجانًا — بدون بيانات بنكية</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="اسم المحل" placeholder="ماركت المدينة" value={form.storeName} onChange={set("storeName")} />
            <Input label="اسم صاحب المحل" placeholder="محمد أحمد" value={form.ownerName} onChange={set("ownerName")} />
          </div>
          <Input label="رقم الهاتف" placeholder="01xxxxxxxxx" value={form.phone} onChange={set("phone")} />
          <Select label="نوع المحل" value={form.storeType} onChange={set("storeType")}>
            <option value="">اختر النوع</option>
            <option>سوبر ماركت</option><option>صيدلية</option><option>إلكترونيات</option>
            <option>مواد تجميل</option><option>بقالة</option><option>أخرى</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="عدد الفروع" value={form.branches} onChange={set("branches")} />
            <Input label="عدد الكاشيرين" value={form.cashiers} onChange={set("cashiers")} />
          </div>
          <Input label="المدينة" placeholder="القاهرة" value={form.city} onChange={set("city")} />
          <Select label="أفضل وقت للتواصل" value={form.time} onChange={set("time")}>
            <option value="">اختر الوقت</option>
            <option>صباحًا (9-12)</option><option>ظهرًا (12-3)</option><option>مساءً (3-7)</option>
          </Select>
          <Btn className="w-full justify-center" size="lg" onClick={() => setSubmitted(true)}>إرسال الطلب</Btn>
        </div>
        <div className="text-center mt-3">
          <button onClick={() => onNav("login")} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">← عندك حساب؟ سجل دخول</button>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
function OnboardingWizard({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = ["معلومات المحل", "الفرع الرئيسي", "الضرائب والدفع", "الأجهزة", "أول كاشير"];
  return (
    <div className="min-h-screen bg-input-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg">
        {/* Step indicators */}
        <div className="flex items-center mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white ring-4 ring-primary/20" : "bg-border text-muted-foreground"}`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1.5 whitespace-nowrap ${i === step ? "text-primary font-medium" : "text-muted-foreground"}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mb-3 mx-2 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-foreground text-lg mb-4">معلومات المحل</h2>
              <Input label="اسم المحل" placeholder="ماركت المدينة" />
              <Input label="العنوان" placeholder="شارع الملك فيصل، الجيزة" />
              <Input label="رقم الهاتف" placeholder="01xxxxxxxxx" />
              <Select label="نوع المحل"><option>سوبر ماركت</option><option>صيدلية</option><option>إلكترونيات</option></Select>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-foreground text-lg mb-4">إعداد الفرع الرئيسي</h2>
              <Input label="اسم الفرع" placeholder="الفرع الرئيسي" />
              <Input label="عنوان الفرع" placeholder="العنوان التفصيلي" />
              <Input label="هاتف الفرع" placeholder="01xxxxxxxxx" />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-foreground text-lg mb-4">الضرائب وطرق الدفع</h2>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                <div><p className="text-sm font-medium text-foreground">تفعيل ضريبة القيمة المضافة</p><p className="text-xs text-muted-foreground">تضاف على الفواتير تلقائيًا</p></div>
                <div className="w-10 h-5 rounded-full bg-primary cursor-pointer relative"><div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" /></div>
              </div>
              <Input label="نسبة الضريبة %" placeholder="14" />
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">طرق الدفع</label>
                <div className="grid grid-cols-2 gap-2">
                  {["كاش", "كارت", "محفظة إلكترونية", "دفع مختلط"].map(m => (
                    <label key={m} className="flex items-center gap-2 p-2.5 rounded-xl border border-border cursor-pointer hover:bg-muted/50 text-sm text-foreground">
                      <input type="checkbox" defaultChecked className="accent-primary" />{m}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <h2 className="font-bold text-foreground text-lg mb-4">إعداد الأجهزة</h2>
              {[{ name: "طابعة إيصالات", icon: Printer }, { name: "ماسح باركود", icon: Hash }, { name: "درج نقود", icon: DollarSign }, { name: "طابعة باركود", icon: Tag }].map(h => (
                <div key={h.name} className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center"><h.icon size={15} className="text-primary" /></div>
                    <span className="text-sm font-medium text-foreground">{h.name}</span>
                  </div>
                  <Btn variant="outline" size="sm">إعداد</Btn>
                </div>
              ))}
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-bold text-foreground text-lg mb-4">إضافة أول كاشير</h2>
              <Input label="اسم الكاشير" placeholder="أحمد محمد" />
              <Input label="رقم الهاتف" placeholder="01xxxxxxxxx" />
              <Input label="كلمة المرور" type="password" placeholder="••••••••" />
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
            <Btn variant="outline" onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0} icon={ChevronRight}>السابق</Btn>
            {step < steps.length - 1
              ? <Btn onClick={() => setStep(s => s + 1)} icon={ChevronLeft}>التالي</Btn>
              : <Btn variant="success" onClick={onDone} icon={Check}>إنهاء الإعداد</Btn>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ onNav }: { onNav: (v: View) => void }) {
  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        sub="الجمعة، 5 يوليو 2024 — الفرع الرئيسي"
        actions={
          <>
            <Btn variant="outline" size="sm" icon={Printer}>طباعة تقرير اليوم</Btn>
            <Btn size="sm" icon={ShoppingCart} onClick={() => onNav("pos")}>بيع جديد</Btn>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard title="مبيعات اليوم" value="8,500 ج" sub="47 فاتورة" icon={TrendingUp} trend="up" trendVal="+12% عن أمس" iconBg="bg-teal-50 text-teal-700" />
        <KpiCard title="صافي الربح" value="2,300 ج" sub="هامش 27%" icon={DollarSign} trend="up" trendVal="+8%" iconBg="bg-emerald-50 text-emerald-700" />
        <KpiCard title="عدد الفواتير" value="47" sub="متوسط 181 ج" icon={Receipt} iconBg="bg-blue-50 text-blue-700" />
        <KpiCard title="مرتجعات اليوم" value="95 ج" sub="فاتورة واحدة" icon={RotateCcw} trend="down" trendVal="-5%" iconBg="bg-red-50 text-red-600" />
        <KpiCard title="مخزون منخفض" value="3 منتجات" sub="يحتاج تعبئة" icon={AlertTriangle} iconBg="bg-amber-50 text-amber-700" />
        <KpiCard title="قيمة المخزون" value="42,800 ج" icon={Package} iconBg="bg-violet-50 text-violet-700" />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">إجراءات سريعة</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "بيع جديد", icon: ShoppingCart, view: "pos" as View, variant: "primary" as const },
            { label: "إضافة منتج", icon: Plus, view: "products" as View, variant: "outline" as const },
            { label: "إضافة مصروف", icon: DollarSign, view: "expenses" as View, variant: "outline" as const },
            { label: "فتح شيفت", icon: Clock, view: "shifts" as View, variant: "outline" as const },
            { label: "التقارير", icon: BarChart3, view: "reports" as View, variant: "outline" as const },
            { label: "إضافة موظف", icon: UserCheck, view: "users" as View, variant: "outline" as const },
          ].map(a => (
            <Btn key={a.label} variant={a.variant} size="sm" icon={a.icon} onClick={() => onNav(a.view)}>{a.label}</Btn>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">المبيعات والأرباح — آخر 7 أيام</h3>
            <Badge label="هذا الأسبوع" color="teal" />
          </div>
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={SALES_DATA} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} formatter={(v) => [v + " ج", ""]} />
              <Area type="monotone" dataKey="sales" stroke="#0f766e" strokeWidth={2.5} fill="url(#salesGrad)" name="مبيعات" />
              <Area type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} fill="none" strokeDasharray="4 2" name="ربح" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-primary rounded inline-block" />مبيعات</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-3 h-0.5 bg-emerald-600 rounded inline-block border-dashed border-t border-emerald-600" />ربح</span>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">أفضل المنتجات مبيعًا</h3>
          <div className="space-y-3.5">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-foreground font-medium">{p.name}</span>
                  </div>
                  <span className="text-muted-foreground text-xs font-mono">{p.sales}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(p.sales / 340) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent invoices + alerts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">آخر الفواتير</h3>
            <Btn variant="ghost" size="sm" onClick={() => onNav("sales")}>عرض الكل</Btn>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-muted-foreground text-xs">
                {["رقم الفاتورة", "الكاشير", "الإجمالي", "الدفع", "الحالة"].map(h => (
                  <th key={h} className="py-2.5 px-5 text-right font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVOICES.map(inv => (
                <tr key={inv.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-5 font-mono text-xs text-muted-foreground">{inv.id}</td>
                  <td className="py-3 px-5 font-medium text-foreground">{inv.cashier}</td>
                  <td className="py-3 px-5 font-bold text-foreground">{inv.total} ج</td>
                  <td className="py-3 px-5 text-muted-foreground">{inv.method}</td>
                  <td className="py-3 px-5">
                    <Badge label={inv.status} color={inv.status === "مدفوعة" ? "green" : "red"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-amber-600" />
              <p className="font-semibold text-amber-800 text-sm">مخزون يحتاج تعبئة</p>
            </div>
            <div className="space-y-2">
              {PRODUCTS.filter(p => p.stock < p.minStock).map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-200">
                  <span className="text-sm text-foreground font-medium">{p.name}</span>
                  <span className="text-xs text-red-600 font-bold">{p.stock} فقط</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={15} className="text-red-600" />
              <p className="font-semibold text-red-800 text-sm">قرب انتهاء الصلاحية</p>
            </div>
            <div className="space-y-2">
              {PRODUCTS.filter(p => p.expiry).slice(0, 2).map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-200">
                  <span className="text-sm text-foreground font-medium">{p.name}</span>
                  <span className="text-xs text-red-600 font-mono">{p.expiry}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── POS Screen ───────────────────────────────────────────────────────────────
function POSScreen({ invoiceNum = 896, onSaleComplete }: { invoiceNum?: number; onSaleComplete?: (total: number) => void }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "wallet">("cash");
  const [paid, setPaid] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [activeCat, setActiveCat] = useState("الكل");
  const searchRef = useRef<HTMLInputElement>(null);

  const catList = ["الكل", ...CATEGORIES.map(c => c.name)];
  const filtered = PRODUCTS.filter(p => {
    const matchCat = activeCat === "الكل" || p.category === activeCat;
    const matchSearch = !search || p.name.includes(search) || p.barcode.includes(search);
    return matchCat && matchSearch;
  });

  const addToCart = useCallback((p: Product) => {
    setCart(c => {
      const ex = c.find(i => i.product.id === p.id);
      if (ex) return c.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { product: p, qty: 1, discount: 0 }];
    });
  }, []);

  const updateQty = (id: number, delta: number) => {
    setCart(c => c.map(i => i.product.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };
  const removeItem = (id: number) => setCart(c => c.filter(i => i.product.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const total = subtotal;
  const paidNum = parseFloat(paid || "0");
  const change = Math.max(0, paidNum - total);

  const completeSale = useCallback(() => {
    if (cart.length === 0) { toast.error("السلة فارغة — أضف منتجًا أولاً"); return; }
    setShowReceipt(true);
    toast.success(`تم البيع بنجاح — ${total} ج`);
    onSaleComplete?.(total);
  }, [cart, total, onSaleComplete]);

  const newSale = () => { setCart([]); setPaid(""); setShowReceipt(false); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F12" || (e.ctrlKey && e.key === "Enter")) { e.preventDefault(); completeSale(); }
      if (e.key === "Escape") setSearch("");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [completeSale]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-input-background -m-6 overflow-hidden">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو امسح الباركود..."
              autoFocus
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-card transition-all"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="bg-muted border border-border px-1.5 py-0.5 rounded font-mono">F2</span>
            <span>بحث</span>
            <span className="bg-muted border border-border px-1.5 py-0.5 rounded font-mono">F12</span>
            <span>إتمام</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>متصل</span>
          </div>
        </div>

        {/* Category tabs */}
        <div className="bg-card border-b border-border px-5 py-2 flex items-center gap-2 overflow-x-auto flex-shrink-0 [&::-webkit-scrollbar]:hidden">
          {catList.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer
                ${activeCat === cat ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-border"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 content-start [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border">
          {filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package size={32} className="mb-2 opacity-30" />
              <p className="text-sm">لا توجد منتجات مطابقة</p>
            </div>
          ) : filtered.map(p => (
            <button key={p.id} onClick={() => addToCart(p)}
              className="bg-card rounded-xl border border-border p-3 text-right hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col gap-1.5 group">
              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-1 group-hover:bg-secondary/50 transition-colors">
                <Package size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{p.name}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-sm font-bold text-primary">{p.price} ج</span>
                <span className={`text-[10px] font-medium ${p.stock < p.minStock ? "text-red-500" : "text-muted-foreground"}`}>{p.stock}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="bg-card border-t border-border px-5 py-2.5 flex items-center justify-between text-xs text-muted-foreground flex-shrink-0">
          <span>فاتورة #INV-2024-{invoiceNum}</span>
          <span>كاشير: أحمد · الشيفت الصباحي</span>
          <span>{new Date().toLocaleTimeString("ar-EG")}</span>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-80 xl:w-96 bg-card border-r border-border flex flex-col shadow-lg flex-shrink-0">
        {/* Cart header */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">السلة</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">{cart.length} صنف</span>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3 pb-8">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <ShoppingCart size={24} className="opacity-30" />
              </div>
              <p className="text-sm">ابحث عن منتج أو امسح الباركود</p>
            </div>
          ) : cart.map(item => (
            <div key={item.product.id} className="bg-muted/40 rounded-xl p-3 border border-border/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product.price} ج × {item.qty} = <span className="font-bold text-foreground">{item.product.price * item.qty} ج</span></p>
                </div>
                <button onClick={() => removeItem(item.product.id)} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 cursor-pointer transition-colors flex-shrink-0 mr-1">
                  <X size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden bg-card">
                  <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground transition-colors"><Minus size={11} /></button>
                  <span className="w-8 text-center text-sm font-bold text-foreground">{item.qty}</span>
                  <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground transition-colors"><Plus size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals + Payment */}
        <div className="border-t border-border p-4 space-y-4 flex-shrink-0">
          {/* Summary */}
          <div className="bg-muted/40 rounded-xl p-3 space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground"><span>المجموع</span><span>{subtotal} ج</span></div>
            <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t border-border"><span>الإجمالي</span><span className="text-primary text-lg">{total} ج</span></div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">طريقة الدفع</p>
            <div className="grid grid-cols-3 gap-1.5">
              {([["cash", "كاش", Banknote], ["card", "كارت", CreditCard], ["wallet", "محفظة", Wallet]] as const).map(([v, l, Icon]) => (
                <button key={v}
                  onClick={() => setPayMethod(v)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer
                    ${payMethod === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 bg-card"}`}>
                  <Icon size={16} />
                  {l}
                </button>
              ))}
            </div>
          </div>

          {payMethod === "cash" && (
            <div className="flex gap-2 items-center">
              <input
                type="number" placeholder="المبلغ المدفوع" value={paid}
                onChange={e => setPaid(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {change > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
                  <p className="text-[10px] text-emerald-600">الباقي</p>
                  <p className="text-sm font-bold text-emerald-700">{change.toFixed(2)} ج</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={completeSale}
            disabled={cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          >
            <Check size={16} /> إتمام البيع
          </button>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setCart([])} className="py-2 rounded-xl border border-border text-muted-foreground text-xs font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all cursor-pointer flex items-center justify-center gap-1">
              <X size={12} /> إلغاء
            </button>
            <button onClick={() => setShowHeld(true)} className="py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-all cursor-pointer flex items-center justify-center gap-1">
              <Clock size={12} /> تعليق
            </button>
            <button className="py-2 rounded-xl border border-border text-muted-foreground text-xs font-medium hover:bg-muted transition-all cursor-pointer flex items-center justify-center gap-1">
              <RotateCcw size={12} /> استرجاع
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal open={showReceipt} onClose={newSale} title="تم البيع بنجاح">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{total} ج</p>
          <p className="text-sm text-muted-foreground mt-1">فاتورة #INV-2024-{invoiceNum}</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 mb-4 space-y-1.5 text-sm">
          <p className="font-bold text-center text-foreground text-base mb-1">ماركت المدينة</p>
          <p className="text-muted-foreground text-center text-xs mb-3">الفرع الرئيسي — {new Date().toLocaleString("ar-EG")}</p>
          {cart.map(i => (
            <div key={i.product.id} className="flex justify-between text-xs">
              <span className="text-foreground">{i.product.name} × {i.qty}</span>
              <span className="font-medium text-foreground">{i.product.price * i.qty} ج</span>
            </div>
          ))}
          <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold text-foreground">
            <span>الإجمالي</span><span>{total} ج</span>
          </div>
          {change > 0 && <div className="flex justify-between text-xs text-emerald-600 font-bold"><span>الباقي</span><span>{change.toFixed(2)} ج</span></div>}
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" className="flex-1 justify-center" icon={Printer}>طباعة</Btn>
          <Btn variant="success" className="flex-1 justify-center" onClick={newSale}>فاتورة جديدة</Btn>
        </div>
      </Modal>

      <Modal open={showHeld} onClose={() => setShowHeld(false)} title="الطلبات المعلقة">
        <EmptyState icon={Clock} title="لا توجد طلبات معلقة" sub="عند تعليق طلب يظهر هنا" />
      </Modal>
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
function ProductsPage() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null);
  const filtered = PRODUCTS.filter(p => p.name.includes(search) || p.barcode.includes(search));
  return (
    <div>
      <PageHeader title="المنتجات" sub={`${PRODUCTS.length} منتج مسجل`} actions={
        <>
          <Btn variant="outline" size="sm" icon={Upload}>استيراد Excel</Btn>
          <Btn variant="outline" size="sm" icon={Download}>تصدير</Btn>
          <Btn size="sm" icon={Plus} onClick={() => setShowAdd(true)}>إضافة منتج</Btn>
        </>
      } />
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الباركود"
              className="w-full pr-9 py-2 px-3 rounded-lg border border-border bg-input-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <Select className="w-36"><option>كل التصنيفات</option>{CATEGORIES.map(c => <option key={c.id}>{c.name}</option>)}</Select>
          <Select className="w-36"><option>كل الموردين</option>{SUPPLIERS.map(s => <option key={s.id}>{s.name}</option>)}</Select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="لا توجد منتجات" sub="أضف أول منتج للبدء" action={<Btn size="sm" icon={Plus} onClick={() => setShowAdd(true)}>إضافة منتج</Btn>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
                  {["المنتج", "الباركود", "التصنيف", "سعر البيع", "سعر الشراء", "المخزون", "الحد الأدنى", "الحالة", ""].map(h => (
                    <th key={h} className="py-3 px-4 text-right font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.barcode}</td>
                    <td className="py-3 px-4"><Badge label={p.category} color="blue" /></td>
                    <td className="py-3 px-4 font-semibold text-foreground">{p.price} ج</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.cost} ج</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold ${p.stock < p.minStock ? "text-red-600" : "text-foreground"}`}>{p.stock}</span>
                        {p.stock < p.minStock && <AlertTriangle size={12} className="text-amber-500" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.minStock}</td>
                    <td className="py-3 px-4"><Badge label={p.status === "active" ? "نشط" : "غير نشط"} color={p.status === "active" ? "green" : "gray"} /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => setConfirm({ id: p.id, name: p.name })} className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
          <span>عرض {filtered.length} من {PRODUCTS.length} منتج</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded border border-border bg-card hover:bg-muted cursor-pointer">السابق</button>
            <span className="px-3 py-1 rounded bg-primary text-white font-medium">1</span>
            <button className="px-2 py-1 rounded border border-border bg-card hover:bg-muted cursor-pointer">التالي</button>
          </div>
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة منتج جديد" wide>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">المعلومات الأساسية</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="اسم المنتج" placeholder="لبن جهينة" />
              <Input label="الباركود" placeholder="6223001234567" />
              <Select label="التصنيف"><option>اختر تصنيف</option>{CATEGORIES.map(c => <option key={c.id}>{c.name}</option>)}</Select>
              <Input label="الوحدة" placeholder="كيلو / كرتونة / قطعة" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">التسعير والمخزون</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="سعر الشراء (ج)" placeholder="0.00" />
              <Input label="سعر البيع (ج)" placeholder="0.00" />
              <Input label="الكمية الأولية" placeholder="0" />
              <Input label="الحد الأدنى للمخزون" placeholder="10" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">معلومات إضافية</p>
            <div className="grid grid-cols-2 gap-3">
              <Select label="المورد"><option>اختر موردًا</option>{SUPPLIERS.map(s => <option key={s.id}>{s.name}</option>)}</Select>
              <Input label="تاريخ انتهاء الصلاحية" type="date" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
          <Btn variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Btn>
          <Btn icon={Check} onClick={() => { setShowAdd(false); toast.success("تم إضافة المنتج بنجاح"); }}>إضافة المنتج</Btn>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => { toast.success(`تم حذف ${confirm?.name}`); }}
        title={`حذف ${confirm?.name}؟`}
        body="سيتم حذف المنتج نهائياً ولا يمكن التراجع عن هذا الإجراء."
        danger
      />
    </div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoriesPage() {
  return (
    <div>
      <PageHeader title="التصنيفات" sub={`${CATEGORIES.length} تصنيفات`} actions={<Btn size="sm" icon={Plus}>إضافة تصنيف</Btn>} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATEGORIES.map(c => (
          <div key={c.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all hover:border-primary/20">
            <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center" style={{ background: c.color + "18" }}>
              <Tag size={20} style={{ color: c.color }} />
            </div>
            <h3 className="font-bold text-foreground mb-1">{c.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{c.count} منتج</p>
            <div className="flex items-center justify-between">
              <Badge label={c.active ? "نشط" : "غير نشط"} color={c.active ? "green" : "gray"} />
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground transition-colors"><Edit2 size={13} /></button>
                <button className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inventory ────────────────────────────────────────────────────────────────
function InventoryPage() {
  const [tab, setTab] = useState<"stock" | "movements" | "alerts">("stock");
  const movements = [
    { product: "لبن جهينة", type: "شراء", qty: "+24", before: 24, after: 48, user: "سارة", date: "اليوم 09:15" },
    { product: "أرز مصري", type: "بيع", qty: "-2", before: 10, after: 8, user: "أحمد", date: "اليوم 11:30" },
    { product: "بسكويت", type: "تلف", qty: "-3", before: 8, after: 5, user: "سارة", date: "أمس 14:00" },
  ];
  const typeColor: Record<string, string> = { "شراء": "green", "بيع": "blue", "تلف": "red", "مرتجع": "yellow", "تعديل": "gray" };
  const tabs = [{ id: "stock", label: "المخزون الحالي" }, { id: "movements", label: "سجل الحركات" }, { id: "alerts", label: "التنبيهات" }] as const;

  return (
    <div>
      <PageHeader title="المخزون" sub="متابعة وإدارة مخزون المنتجات" actions={<Btn size="sm" icon={Plus}>تعديل مخزون</Btn>} />
      <div className="flex gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${tab === t.id ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "stock" && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
              {["المنتج", "التصنيف", "المخزون", "الحد الأدنى", "الحالة", "انتهاء الصلاحية"].map(h => (
                <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {PRODUCTS.map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                  <td className="py-3 px-4"><Badge label={p.category} color="blue" /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${p.stock < p.minStock ? "bg-red-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(100, (p.stock / (p.minStock * 3)) * 100)}%` }} />
                      </div>
                      <span className={`font-semibold ${p.stock < p.minStock ? "text-red-600" : "text-foreground"}`}>{p.stock}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{p.minStock}</td>
                  <td className="py-3 px-4">
                    {p.stock < p.minStock ? <Badge label="منخفض" color="red" /> : <Badge label="كافي" color="green" />}
                  </td>
                  <td className="py-3 px-4">
                    {p.expiry ? <span className="text-amber-600 font-medium text-xs">{p.expiry}</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "movements" && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
              {["المنتج", "نوع الحركة", "الكمية", "قبل", "بعد", "المستخدم", "الوقت"].map(h => (
                <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={i} className="border-t border-border hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium text-foreground">{m.product}</td>
                  <td className="py-3 px-4"><Badge label={m.type} color={typeColor[m.type] || "gray"} /></td>
                  <td className="py-3 px-4 font-bold" style={{ color: m.qty.startsWith("+") ? "#16a34a" : "#dc2626" }}>{m.qty}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.before}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{m.after}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.user}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{m.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "alerts" && (
        <div className="space-y-3">
          {PRODUCTS.filter(p => p.stock < p.minStock || p.expiry).map(p => (
            <div key={p.id} className={`rounded-xl border p-4 flex items-center justify-between ${p.stock < p.minStock ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${p.stock < p.minStock ? "bg-red-100" : "bg-amber-100"}`}>
                  <AlertTriangle size={16} className={p.stock < p.minStock ? "text-red-600" : "text-amber-600"} />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.stock < p.minStock && `مخزون منخفض — متبقي ${p.stock} فقط`}
                    {p.expiry && ` · ينتهي ${p.expiry}`}
                  </p>
                </div>
              </div>
              <Btn variant="outline" size="sm" icon={Plus}>طلب شراء</Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sales ────────────────────────────────────────────────────────────────────
function SalesPage({ onNav }: { onNav: (v: View) => void }) {
  const [selected, setSelected] = useState<typeof INVOICES[0] | null>(null);
  return (
    <div>
      <PageHeader title="المبيعات والفواتير" sub="سجل كامل بجميع الفواتير" actions={
        <>
          <Btn variant="outline" size="sm" icon={Download}>تصدير</Btn>
          <Btn size="sm" icon={ShoppingCart} onClick={() => onNav("pos")}>بيع جديد</Btn>
        </>
      } />
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="بحث برقم الفاتورة أو العميل" className="w-full pr-9 py-2 px-3 rounded-lg border border-border bg-input-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <Select className="w-36"><option>كل الكاشيرين</option><option>أحمد</option><option>محمود</option></Select>
          <Select className="w-36"><option>كل طرق الدفع</option><option>كاش</option><option>كارت</option><option>محفظة</option></Select>
          <input type="date" className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
            {["رقم الفاتورة", "العميل", "الكاشير", "الوقت", "الأصناف", "الإجمالي", "الدفع", "الحالة", ""].map(h => (
              <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {INVOICES.map(inv => (
              <tr key={inv.id} className="border-t border-border hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setSelected(inv)}>
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{inv.id}</td>
                <td className="py-3 px-4 font-medium text-foreground">{inv.customer}</td>
                <td className="py-3 px-4 text-muted-foreground">{inv.cashier}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{inv.time}</td>
                <td className="py-3 px-4 text-muted-foreground">{inv.items}</td>
                <td className="py-3 px-4 font-bold text-foreground">{inv.total} ج</td>
                <td className="py-3 px-4 text-muted-foreground">{inv.method}</td>
                <td className="py-3 px-4"><Badge label={inv.status} color={inv.status === "مدفوعة" ? "green" : "red"} /></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"><Printer size={13} /></button>
                    <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"><RotateCcw size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
          <span>{INVOICES.length} فاتورة</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded border border-border bg-card hover:bg-muted cursor-pointer">السابق</button>
            <span className="px-3 py-1 rounded bg-primary text-white font-medium">1</span>
            <button className="px-2 py-1 rounded border border-border bg-card hover:bg-muted cursor-pointer">التالي</button>
          </div>
        </div>
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`تفاصيل فاتورة ${selected?.id}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[["الكاشير", selected.cashier], ["العميل", selected.customer], ["طريقة الدفع", selected.method], ["الوقت", selected.time]].map(([k, v]) => (
                <div key={k} className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">{k}</p>
                  <p className="font-semibold text-foreground text-sm">{v}</p>
                </div>
              ))}
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
              <p className="text-3xl font-extrabold text-foreground">{selected.total} ج</p>
              <div className="mt-2"><Badge label={selected.status} color={selected.status === "مدفوعة" ? "green" : "red"} /></div>
            </div>
            <div className="flex gap-2">
              <Btn variant="outline" className="flex-1 justify-center" icon={Printer}>طباعة</Btn>
              {selected.status === "مدفوعة" && <Btn variant="danger" className="flex-1 justify-center" icon={RotateCcw}>استرجاع</Btn>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Returns ─────────────────────────────────────────────────────────────────
function ReturnsPage() {
  const [step, setStep] = useState<"search" | "items" | "confirm">("search");
  const [inv, setInv] = useState("");
  return (
    <div>
      <PageHeader title="المرتجعات والاسترجاع" sub="استرجاع كامل أو جزئي للفواتير" />
      <div className="max-w-xl space-y-4">
        <div className="flex items-center gap-3">
          {["search", "items", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-primary text-white" : ["confirm", "items"].includes(step) && i < ["search", "items", "confirm"].indexOf(step) ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {i + 1}
              </div>
              <span className={`text-xs ${step === s ? "text-primary font-medium" : "text-muted-foreground"}`}>{["البحث عن الفاتورة", "اختيار الأصناف", "تأكيد الاسترجاع"][i]}</span>
              {i < 2 && <div className={`w-8 h-0.5 ${i < ["search", "items", "confirm"].indexOf(step) ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          {step === "search" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">ابحث عن الفاتورة</h3>
              <Input placeholder="رقم الفاتورة مثل INV-0894" value={inv} onChange={setInv} />
              <Btn icon={Search} onClick={() => inv && setStep("items")}>بحث</Btn>
            </div>
          )}
          {step === "items" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">اختار الأصناف للاسترجاع</h3>
                <Badge label={inv} color="blue" />
              </div>
              {[{ name: "مياه معدنية", qty: 3, price: 5 }, { name: "عصير مانجو", qty: 2, price: 15 }].map(item => (
                <label key={item.name} className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="accent-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.qty} × {item.price} ج</p>
                    </div>
                  </div>
                  <span className="font-bold text-foreground">{item.qty * item.price} ج</span>
                </label>
              ))}
              <Select label="سبب الاسترجاع">
                <option>تالف</option><option>خطأ في الطلب</option><option>منتج منتهي الصلاحية</option><option>أخرى</option>
              </Select>
              <div className="flex gap-2">
                <Btn variant="outline" onClick={() => setStep("search")}>رجوع</Btn>
                <Btn onClick={() => setStep("confirm")}>متابعة</Btn>
              </div>
            </div>
          )}
          {step === "confirm" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h3 className="font-bold text-foreground text-lg">تم الاسترجاع بنجاح</h3>
              <p className="text-muted-foreground text-sm">تم إعادة الكمية للمخزون وتسجيل الاسترجاع</p>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-2xl font-bold text-foreground">25 ج</p>
                <p className="text-sm text-muted-foreground">تم استرجاعها</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Btn variant="outline" icon={Printer}>طباعة إيصال</Btn>
                <Btn onClick={() => setStep("search")}>استرجاع آخر</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Expenses ────────────────────────────────────────────────────────────────
function ExpensesPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null);
  const total = EXPENSES.reduce((s, e) => s + e.amount, 0);
  return (
    <div>
      <PageHeader title="المصاريف" sub={`إجمالي اليوم: ${total} ج`} actions={<Btn size="sm" icon={Plus} onClick={() => setShowAdd(true)}>إضافة مصروف</Btn>} />
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
            {["الوصف", "التصنيف", "المبلغ", "المضاف بواسطة", "الفرع", "التاريخ", ""].map(h => (
              <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {EXPENSES.map(e => (
              <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                <td className="py-3 px-4 font-medium text-foreground">{e.name}</td>
                <td className="py-3 px-4"><Badge label={e.category} color="blue" /></td>
                <td className="py-3 px-4 font-bold text-foreground">{e.amount} ج</td>
                <td className="py-3 px-4 text-muted-foreground">{e.cashier}</td>
                <td className="py-3 px-4 text-muted-foreground">{e.branch}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{e.date}</td>
                <td className="py-3 px-4"><button onClick={() => setConfirm({ id: e.id, name: e.name })} className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer text-muted-foreground hover:text-red-500"><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة مصروف جديد">
        <div className="space-y-4">
          <Input label="وصف المصروف" placeholder="كهرباء، صيانة، توصيل..." />
          <Select label="التصنيف">
            {["إيجار", "مرتبات", "كهرباء", "صيانة", "توصيل", "أخرى"].map(c => <option key={c}>{c}</option>)}
          </Select>
          <Input label="المبلغ (ج)" placeholder="0.00" />
          <Select label="الفرع">
            {BRANCHES.map(b => <option key={b}>{b}</option>)}
          </Select>
          <div className="flex gap-2 pt-2">
            <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowAdd(false)}>إلغاء</Btn>
            <Btn className="flex-1 justify-center" onClick={() => { setShowAdd(false); toast.success("تم إضافة المصروف"); }}>إضافة</Btn>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => toast.success(`تم حذف "${confirm?.name}"`)}
        title={`حذف "${confirm?.name}"؟`}
        body="سيتم حذف هذا المصروف نهائياً."
        danger
      />
    </div>
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────
function ReportsPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  return (
    <div>
      <PageHeader title="التقارير" sub="تحليل شامل لأداء المحل" actions={
        <>
          <Btn variant="outline" size="sm" icon={Download}>Excel</Btn>
          <Btn variant="outline" size="sm" icon={Printer}>طباعة</Btn>
        </>
      } />
      <div className="flex gap-2 mb-6">
        {(["daily", "weekly", "monthly"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${period === p ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {p === "daily" ? "يومي" : p === "weekly" ? "أسبوعي" : "شهري"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="إجمالي المبيعات" value="39,600 ج" sub="7 أيام" icon={TrendingUp} trend="up" trendVal="+18%" iconBg="bg-teal-50 text-teal-700" />
        <KpiCard title="صافي الربح" value="10,530 ج" sub="هامش 26.6%" icon={DollarSign} trend="up" trendVal="+12%" iconBg="bg-emerald-50 text-emerald-700" />
        <KpiCard title="عدد الفواتير" value="284" sub="متوسط 139 ج" icon={Receipt} iconBg="bg-blue-50 text-blue-700" />
        <KpiCard title="إجمالي المرتجعات" value="430 ج" sub="3 فواتير" icon={RotateCcw} iconBg="bg-amber-50 text-amber-700" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">مبيعات وأرباح الأسبوع</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SALES_DATA} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} formatter={(v) => [v + " ج", ""]} />
              <Bar dataKey="sales" fill="#0f766e" radius={[4, 4, 0, 0]} name="مبيعات" />
              <Bar dataKey="profit" fill="#16a34a" radius={[4, 4, 0, 0]} name="ربح" />
              <Legend iconType="circle" iconSize={8} formatter={v => v === "sales" ? "مبيعات" : "ربح"} wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">أفضل المنتجات مبيعًا</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f2f4" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#374151" }} width={85} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Bar dataKey="sales" fill="#0f766e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-5">توزيع طرق الدفع</h3>
        <div className="flex items-center justify-around flex-wrap gap-6">
          <RPieChart width={180} height={180}>
            <Pie data={[{ name: "كاش", value: 58 }, { name: "كارت", value: 28 }, { name: "محفظة", value: 14 }]}
              cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={3} dataKey="value">
              {["#0f766e", "#2563eb", "#f59e0b"].map((c, i) => <Cell key={i} fill={c} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} formatter={(v) => [v + "%", ""]} />
          </RPieChart>
          <div className="space-y-3">
            {[["كاش", "58%", "#0f766e", "22,968 ج"], ["كارت", "28%", "#2563eb", "11,088 ج"], ["محفظة", "14%", "#f59e0b", "5,544 ج"]].map(([name, pct, color, val]) => (
              <div key={name as string} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color as string }} />
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-16">{name}</span>
                    <span className="font-bold text-foreground">{pct}</span>
                    <span className="text-xs text-muted-foreground">{val}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Suppliers ────────────────────────────────────────────────────────────────
function SuppliersPage() {
  const [search, setSearch] = useState("");
  const filtered = SUPPLIERS.filter(s => s.name.includes(search) || s.phone.includes(search) || s.city.includes(search));
  return (
    <div>
      <PageHeader title="الموردين" sub={`${SUPPLIERS.length} موردين نشطين`} actions={<Btn size="sm" icon={Plus}>إضافة مورد</Btn>} />
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الهاتف أو المدينة"
              className="w-full pr-9 py-2 px-3 rounded-lg border border-border bg-input-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
            {["المورد", "الهاتف", "المدينة", "الرصيد المستحق", "المنتجات", "الحالة", ""].map(h => (
              <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                <td className="py-3 px-4 font-medium text-foreground">{s.name}</td>
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{s.phone}</td>
                <td className="py-3 px-4 text-muted-foreground">{s.city}</td>
                <td className="py-3 px-4">
                  {s.balance < 0 ? <span className="font-bold text-red-600">{Math.abs(s.balance)} ج</span> : <Badge label="لا يوجد" color="green" />}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{s.products} منتج</td>
                <td className="py-3 px-4"><Badge label="نشط" color="green" /></td>
                <td className="py-3 px-4"><Btn variant="outline" size="sm" icon={ClipboardList}>طلب شراء</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────
function PurchaseOrdersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const orders = [
    { id: "PO-001", supplier: "شركة النور", date: "2024-07-03", expected: "2024-07-08", status: "مرسل", items: 4, total: 2400 },
    { id: "PO-002", supplier: "مورد المدينة", date: "2024-07-01", expected: "2024-07-05", status: "مستلم", items: 6, total: 1800 },
    { id: "PO-003", supplier: "شركة الأمل", date: "2024-06-28", expected: "2024-07-03", status: "ملغي", items: 2, total: 600 },
  ];
  const statusColor: Record<string, string> = { "مرسل": "blue", "مستلم": "green", "ملغي": "red", "مسودة": "gray" };
  return (
    <div>
      <PageHeader title="أوامر الشراء" sub={`${orders.length} أوامر`} actions={<Btn size="sm" icon={Plus} onClick={() => setShowCreate(true)}>أمر شراء جديد</Btn>} />
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
            {["رقم الأمر", "المورد", "تاريخ الطلب", "التسليم المتوقع", "الأصناف", "الإجمالي", "الحالة", ""].map(h => (
              <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t border-border hover:bg-muted/20">
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{o.id}</td>
                <td className="py-3 px-4 font-medium text-foreground">{o.supplier}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{o.date}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{o.expected}</td>
                <td className="py-3 px-4 text-muted-foreground">{o.items}</td>
                <td className="py-3 px-4 font-bold text-foreground">{o.total} ج</td>
                <td className="py-3 px-4"><Badge label={o.status} color={statusColor[o.status] || "gray"} /></td>
                <td className="py-3 px-4 flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"><Eye size={13} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"><Printer size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="أمر شراء جديد" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="المورد"><option>اختر موردًا</option>{SUPPLIERS.map(s => <option key={s.id}>{s.name}</option>)}</Select>
            <Input label="تاريخ التسليم المتوقع" type="date" />
          </div>
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground font-medium grid grid-cols-3 gap-4">
              <span>المنتج</span><span className="text-center">الكمية</span><span className="text-center">السعر</span>
            </div>
            {[1, 2].map(i => (
              <div key={i} className="grid grid-cols-3 gap-4 px-4 py-2 border-t border-border items-center">
                <select className="px-2 py-1.5 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20">
                  {PRODUCTS.slice(0, 6).map(p => <option key={p.id}>{p.name}</option>)}
                </select>
                <input defaultValue={10} type="number" className="px-2 py-1.5 rounded-lg border border-border text-sm outline-none text-center focus:ring-2 focus:ring-primary/20" />
                <input defaultValue={35} type="number" className="px-2 py-1.5 rounded-lg border border-border text-sm outline-none text-center focus:ring-2 focus:ring-primary/20" />
              </div>
            ))}
            <div className="px-4 py-2 border-t border-border">
              <button className="text-primary text-xs font-medium hover:underline cursor-pointer flex items-center gap-1"><Plus size={11} /> إضافة صنف</button>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Btn>
            <Btn variant="secondary">مسودة</Btn>
            <Btn>إرسال للمورد</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Customers ────────────────────────────────────────────────────────────────
function CustomersPage() {
  const [showDebt, setShowDebt] = useState<typeof CUSTOMERS[0] | null>(null);
  const [search, setSearch] = useState("");
  const filtered = CUSTOMERS.filter(c => c.name.includes(search) || c.phone.includes(search));
  return (
    <div>
      <PageHeader title="العملاء والديون" sub={`${CUSTOMERS.length} عملاء مسجلين`} actions={<Btn size="sm" icon={Plus}>إضافة عميل</Btn>} />
      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <KpiCard title="إجمالي الديون" value="470 ج" icon={DollarSign} iconBg="bg-red-50 text-red-600" />
        <KpiCard title="عملاء لديهم ديون" value="2 عملاء" icon={Users} iconBg="bg-amber-50 text-amber-700" />
        <KpiCard title="أكثر عميل شراءً" value="مصطفى السيد" icon={Star} iconBg="bg-teal-50 text-teal-700" />
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو رقم الهاتف"
              className="w-full pr-9 py-2 px-3 rounded-lg border border-border bg-input-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
            {["العميل", "الهاتف", "الدين", "نقاط الولاء", "آخر زيارة", "الفواتير", ""].map(h => (
              <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">{c.name[0]}</div>
                    <span className="font-medium text-foreground">{c.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{c.phone}</td>
                <td className="py-3 px-4">{c.debt > 0 ? <span className="font-bold text-red-600">{c.debt} ج</span> : <Badge label="لا يوجد" color="green" />}</td>
                <td className="py-3 px-4 text-muted-foreground">{c.points} نقطة</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{c.lastVisit}</td>
                <td className="py-3 px-4 text-muted-foreground">{c.invoices}</td>
                <td className="py-3 px-4">
                  {c.debt > 0 && <Btn variant="outline" size="sm" onClick={() => setShowDebt(c)}>تسجيل دفع</Btn>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!showDebt} onClose={() => setShowDebt(null)} title={`تسجيل دفع — ${showDebt?.name}`}>
        {showDebt && (
          <div className="space-y-4">
            <AlertBanner type="warning" title={`الدين الكلي: ${showDebt.debt} ج`} />
            <Input label="المبلغ المدفوع" placeholder="0.00" />
            <Input label="ملاحظة" placeholder="اختياري" />
            <div className="flex gap-2">
              <Btn variant="outline" className="flex-1 justify-center" onClick={() => setShowDebt(null)}>إلغاء</Btn>
              <Btn variant="success" className="flex-1 justify-center" onClick={() => setShowDebt(null)}>تسجيل الدفع</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
function NotificationsPage() {
  const iconMap: Record<string, React.ElementType> = { warning: AlertTriangle, danger: XCircle, info: Info, success: CheckCircle };
  const colorMap: Record<string, string> = { warning: "text-amber-500", danger: "text-red-500", info: "text-blue-500", success: "text-emerald-500" };
  const bgMap: Record<string, string> = { warning: "bg-amber-50", danger: "bg-red-50", info: "bg-blue-50", success: "bg-emerald-50" };
  return (
    <div>
      <PageHeader title="مركز التنبيهات" sub={`${NOTIFICATIONS.filter(n => !n.read).length} غير مقروءة`} actions={<Btn variant="ghost" size="sm">تحديد الكل كمقروء</Btn>} />
      <div className="space-y-2">
        {NOTIFICATIONS.map(n => {
          const Icon = iconMap[n.type];
          return (
            <div key={n.id} className={`bg-card rounded-xl border border-border p-4 flex items-start gap-3 transition-all hover:shadow-sm ${!n.read ? "border-r-[3px] border-r-primary" : ""}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bgMap[n.type]}`}>
                <Icon size={15} className={colorMap[n.type]} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground text-sm">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Insights ──────────────────────────────────────────────────────────────
function AIInsightsPage() {
  const insights = [
    { icon: AlertTriangle, title: "المنتج قرب يخلص", body: "أرز مصري — متبقي 8 وحدات. توقع النفاد خلال يومين.", action: "طلب شراء", type: "danger" },
    { icon: TrendingDown, title: "المبيعات أقل من الأسبوع الماضي", body: "مبيعات الثلاثاء أقل 18% مقارنة بالأسبوع الماضي.", action: "عرض التقارير", type: "warning" },
    { icon: Package, title: "منتج بقاله وقت مش بيتباع", body: "مسحوق الغسيل — بقاله 3 أسابيع بدون حركة.", action: "إضافة خصم", type: "info" },
    { icon: DollarSign, title: "الربح اليومي أقل من المتوقع", body: "ربح اليوم 2,300 ج — أقل من متوسط الأسبوع 2,800 ج.", action: "تفاصيل", type: "warning" },
    { icon: Truck, title: "اقتراح طلب شراء", body: "بناءً على المبيعات، ننصح بطلب لبن جهينة وجبنة بيضاء.", action: "إنشاء أمر شراء", type: "success" },
    { icon: Percent, title: "منتجات محتاجة عرض أو خصم", body: "البسكويت — مخزون مرتفع ومبيعات بطيئة.", action: "إضافة خصم", type: "info" },
    { icon: Users, title: "كاشير مبيعاته أقل من المعتاد", body: "محمود — مبيعاته هذا الأسبوع أقل 25% من معدله.", action: "عرض التقرير", type: "warning" },
    { icon: BarChart2, title: "مصاريف الشهر أعلى من الطبيعي", body: "مصاريف يوليو أعلى 32% من متوسط الأشهر الماضية.", action: "تفاصيل المصاريف", type: "danger" },
  ];
  const styles: Record<string, { bg: string; iconBg: string; ic: string }> = {
    danger: { bg: "border-red-200", iconBg: "bg-red-100", ic: "text-red-600" },
    warning: { bg: "border-amber-200", iconBg: "bg-amber-100", ic: "text-amber-600" },
    info: { bg: "border-blue-200", iconBg: "bg-blue-100", ic: "text-blue-600" },
    success: { bg: "border-emerald-200", iconBg: "bg-emerald-100", ic: "text-emerald-600" },
  };
  return (
    <div>
      <PageHeader title="الذكاء والتحليلات" sub="تنبيهات ذكية مبنية على بيانات محلك" actions={
        <div className="flex items-center gap-2 bg-secondary border border-primary/20 px-3 py-1.5 rounded-full text-xs text-secondary-foreground">
          <Zap size={11} className="text-primary" /> محدّث منذ 30 دقيقة
        </div>
      } />
      <div className="grid md:grid-cols-2 gap-4">
        {insights.map((ins, i) => {
          const s = styles[ins.type];
          return (
            <div key={i} className={`bg-card rounded-xl border ${s.bg} p-4`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.iconBg}`}>
                  <ins.icon size={17} className={s.ic} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm mb-1">{ins.title}</p>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{ins.body}</p>
                  <Btn variant="outline" size="sm">{ins.action}</Btn>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────
function UsersPage() {
  const roleLabel: Record<string, string> = { owner: "مالك", manager: "مدير", cashier: "كاشير", inventory: "موظف مخزون" };
  const roleColor: Record<string, string> = { owner: "purple", manager: "blue", cashier: "green", inventory: "yellow" };
  return (
    <div>
      <PageHeader title="المستخدمين والصلاحيات" sub={`${USERS.length} موظفين`} actions={<Btn size="sm" icon={Plus}>إضافة موظف</Btn>} />
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-5">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
            {["الموظف", "الدور", "الهاتف", "الفرع", "آخر دخول", "الحالة", ""].map(h => (
              <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {USERS.map(u => (
              <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">{u.name[0]}</div>
                    <span className="font-medium text-foreground">{u.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4"><Badge label={roleLabel[u.role]} color={roleColor[u.role]} /></td>
                <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{u.phone}</td>
                <td className="py-3 px-4 text-muted-foreground">{u.branch}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{u.lastLogin}</td>
                <td className="py-3 px-4"><Badge label={u.status === "active" ? "نشط" : "غير نشط"} color={u.status === "active" ? "green" : "gray"} /></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"><Edit2 size={13} /></button>
                    <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"><Lock size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">مصفوفة الصلاحيات</h3>
        <div className="overflow-x-auto">
          <table className="text-sm w-full">
            <thead><tr className="text-xs text-muted-foreground border-b border-border">
              <th className="pb-3 text-right w-44 font-medium">الصلاحية</th>
              {["مالك", "مدير", "كاشير", "موظف مخزون"].map(r => <th key={r} className="pb-3 text-center font-medium">{r}</th>)}
            </tr></thead>
            <tbody>
              {[
                ["لوحة التحكم", true, true, false, false],
                ["إدارة المنتجات", true, true, false, true],
                ["عمليات البيع", true, true, true, false],
                ["استرجاع الفواتير", true, true, false, false],
                ["إدارة المخزون", true, true, false, true],
                ["عرض التقارير", true, true, false, false],
                ["إدارة الموظفين", true, false, false, false],
                ["الإعدادات", true, false, false, false],
              ].map(([label, ...perms]) => (
                <tr key={label as string} className="border-t border-border/50">
                  <td className="py-2.5 text-foreground text-sm">{label as string}</td>
                  {(perms as boolean[]).map((p, i) => (
                    <td key={i} className="py-2.5 text-center">
                      {p
                        ? <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><Check size={11} className="text-emerald-600" /></div>
                        : <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center mx-auto"><X size={11} className="text-muted-foreground/40" /></div>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Shifts ───────────────────────────────────────────────────────────────────
function ShiftsPage() {
  const [tab, setTab] = useState<"active" | "open" | "close" | "history">("active");
  return (
    <div>
      <PageHeader title="إدارة الشيفتات" sub="متابعة شيفتات الكاشيرين" />
      <div className="flex gap-2 mb-5">
        {([["active", "الشيفت الحالي"], ["open", "فتح شيفت"], ["close", "إغلاق الشيفت"], ["history", "سجل الشيفتات"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${tab === id ? "bg-primary text-white shadow-sm" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "active" && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: "أحمد", branch: "الفرع الرئيسي", sales: 4200, invoices: 23, returns: 95, expenses: 50 },
            { name: "محمود", branch: "فرع الحي الأول", sales: 4300, invoices: 24, returns: 0, expenses: 0 },
          ].map(c => (
            <div key={c.name} className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">{c.name[0]}</div>
                  <div>
                    <p className="font-bold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.branch} · منذ 9:00 ص</p>
                  </div>
                </div>
                <Badge label="مفتوح" color="green" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[["المبيعات", c.sales + " ج", "teal"], ["الفواتير", c.invoices, "blue"], ["المرتجعات", c.returns + " ج", "red"], ["المصاريف", c.expenses + " ج", "amber"]].map(([k, v, color]) => (
                  <div key={k as string} className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">{k as string}</p>
                    <p className="font-bold text-foreground mt-0.5">{v as string | number}</p>
                  </div>
                ))}
              </div>
              <Btn variant="outline" className="w-full justify-center" size="sm" onClick={() => setTab("close")}>إغلاق الشيفت</Btn>
            </div>
          ))}
        </div>
      )}

      {tab === "open" && (
        <div className="max-w-md bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-foreground">فتح شيفت جديد</h3>
          <Select label="الكاشير"><option>أحمد</option><option>محمود</option></Select>
          <Input label="رصيد الفتح (كاش)" placeholder="0.00" />
          <Input label="ملاحظات" placeholder="اختياري" />
          <Btn variant="success" className="w-full justify-center" icon={Check} onClick={() => toast.success("تم فتح الشيفت بنجاح")}>فتح الشيفت</Btn>
        </div>
      )}

      {tab === "close" && (
        <div className="max-w-md bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-foreground">إغلاق شيفت — أحمد</h3>
          <div className="space-y-2 bg-muted/50 rounded-xl p-4">
            {[["المبيعات الكلية", "4,200 ج"], ["كاش متوقع", "2,900 ج"]].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="font-bold text-foreground">{v}</span></div>
            ))}
          </div>
          <Input label="الكاش الفعلي" placeholder="0.00" />
          <Input label="ملاحظات" placeholder="اختياري" />
          <Btn className="w-full justify-center" icon={CheckCircle} onClick={() => toast.success("تم إغلاق الشيفت بنجاح")}>إغلاق الشيفت</Btn>
        </div>
      )}

      {tab === "history" && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
              {["الكاشير", "الفرع", "البداية", "النهاية", "المبيعات", "الفرق", "الحالة"].map(h => (
                <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                { c: "أحمد", b: "الفرع الرئيسي", s: "9:00 ص أمس", e: "10:00 م أمس", sales: "7,100 ج", diff: "0 ج" },
                { c: "محمود", b: "فرع الحي الأول", s: "9:00 ص أمس", e: "10:00 م أمس", sales: "3,800 ج", diff: "-20 ج" },
              ].map((r, i) => (
                <tr key={i} className="border-t border-border hover:bg-muted/20">
                  <td className="py-3 px-4 font-medium text-foreground">{r.c}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.b}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{r.s}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{r.e}</td>
                  <td className="py-3 px-4 font-bold text-foreground">{r.sales}</td>
                  <td className="py-3 px-4" style={{ color: r.diff.includes("-") ? "#dc2626" : "#16a34a" }}>{r.diff}</td>
                  <td className="py-3 px-4"><Badge label="مغلق" color="gray" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── End of Day ───────────────────────────────────────────────────────────────
function EndOfDayPage() {
  return (
    <div>
      <PageHeader title="إغلاق اليوم" sub="الجمعة، 5 يوليو 2024" actions={
        <>
          <Btn variant="outline" size="sm" icon={Download}>Excel</Btn>
          <Btn size="sm" icon={Printer}>طباعة التقرير</Btn>
        </>
      } />
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">ملخص اليوم</h3>
          <div className="space-y-2">
            {[
              ["إجمالي المبيعات", "8,500 ج", "text-foreground"],
              ["إجمالي المرتجعات", "95 ج", "text-red-600"],
              ["إجمالي المصاريف", "1,070 ج", "text-amber-600"],
              ["صافي الكاش", "7,335 ج", "text-primary font-bold"],
              ["مدفوعات كارت", "2,380 ج", "text-foreground"],
              ["مدفوعات محفظة", "785 ج", "text-foreground"],
            ].map(([k, v, cls]) => (
              <div key={k} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground text-sm">{k}</span>
                <span className={`text-sm ${cls}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold text-foreground mb-3">ملخص الكاشيرين</h3>
            <div className="space-y-3">
              {[{ name: "أحمد", sales: 4200, branch: "الفرع الرئيسي", inv: 23 }, { name: "محمود", sales: 4300, branch: "فرع الحي الأول", inv: 24 }].map(c => (
                <div key={c.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">{c.name[0]}</div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.branch} · {c.inv} فاتورة</p>
                    </div>
                  </div>
                  <p className="font-bold text-foreground">{c.sales.toLocaleString("ar-EG")} ج</p>
                </div>
              ))}
            </div>
          </div>
          <AlertBanner type="warning" title="منتجات تحتاج تعبئة عاجلة" body={PRODUCTS.filter(p => p.stock < p.minStock).map(p => p.name).join("، ")} />
        </div>
      </div>
    </div>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
function ActivityLogPage() {
  const [search, setSearch] = useState("");
  const filtered = ACTIVITY_LOG.filter(a => a.user.includes(search) || a.action.includes(search) || a.detail.includes(search));
  return (
    <div>
      <PageHeader title="سجل النشاط" sub="جميع العمليات المسجلة" />
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالمستخدم أو الإجراء"
              className="w-full pr-9 py-2 px-3 rounded-lg border border-border bg-input-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <Select className="w-40"><option>كل المستخدمين</option>{USERS.map(u => <option key={u.id}>{u.name}</option>)}</Select>
          <input type="date" className="px-3 py-2 rounded-lg border border-border bg-input-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
            {["المستخدم", "الإجراء", "التفاصيل", "الوقت", "الفرع"].map(h => (
              <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-t border-border hover:bg-muted/20">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">{a.user[0]}</div>
                    <span className="font-medium text-foreground text-sm">{a.user}</span>
                  </div>
                </td>
                <td className="py-3 px-4"><Badge label={a.action} color="blue" /></td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{a.detail}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{a.date} {a.time}</td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{a.branch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Subscription ─────────────────────────────────────────────────────────────
function SubscriptionPage() {
  return (
    <div>
      <PageHeader title="الاشتراك والفواتير" />
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2 bg-card rounded-xl border-2 border-primary/30 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge label="Pro" color="purple" /><Badge label="نشط" color="green" />
              </div>
              <h3 className="font-bold text-foreground text-xl">خطة Pro</h3>
              <p className="text-muted-foreground text-sm mt-1">تتجدد تلقائيًا في 31 يوليو 2024</p>
            </div>
            <div className="text-left">
              <span className="text-3xl font-extrabold text-foreground">399</span>
              <span className="text-sm text-muted-foreground"> ج/شهر</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "المستخدمون", used: 4, max: 10 },
              { label: "المنتجات", used: 15, max: 999 },
              { label: "الفروع", used: 2, max: 3 },
              { label: "الفواتير/شهر", used: 284, max: 5000 },
            ].map(u => (
              <div key={u.label} className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">{u.label}</p>
                <p className="font-bold text-foreground text-sm">{u.used} / {u.max === 999 ? "∞" : u.max}</p>
                <div className="h-1 bg-border rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (u.used / (u.max === 999 ? 1000 : u.max)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Btn icon={ArrowUpRight}>ترقية للـ Business</Btn>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3">سجل الفواتير</h3>
          <div className="space-y-2">
            {["يونيو 2024", "مايو 2024", "أبريل 2024"].map(m => (
              <div key={m} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{m}</p>
                  <p className="text-xs text-muted-foreground">Pro · 399 ج</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label="مدفوعة" color="green" />
                  <button className="text-primary text-xs hover:underline cursor-pointer font-medium">PDF</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);
  const guides = [
    { title: "كيفية إضافة منتج", icon: Package, steps: ["اذهب لصفحة المنتجات", "اضغط زر إضافة منتج", "أدخل بيانات المنتج", "اضغط حفظ"] },
    { title: "كيفية البيع من الكاشير", icon: ShoppingCart, steps: ["افتح صفحة الكاشير", "ابحث عن المنتج أو امسح الباركود", "راجع السلة وحدد طريقة الدفع", "اضغط إتمام البيع"] },
    { title: "كيفية طباعة فاتورة", icon: Printer, steps: ["افتح صفحة المبيعات", "ابحث عن الفاتورة", "اضغط أيقونة الطباعة"] },
    { title: "كيفية إغلاق الشيفت", icon: Clock, steps: ["اذهب لصفحة الشيفتات", "اضغط إغلاق الشيفت", "أدخل الكاش الفعلي", "اضغط تأكيد الإغلاق"] },
  ];
  const faqs = [
    { q: "كيف أضيف كاشير جديد؟", a: "من صفحة المستخدمين، اضغط إضافة موظف واختر دور كاشير." },
    { q: "كيف أعمل نسخة احتياطية؟", a: "من الإعدادات > النسخ الاحتياطي، اضغط نسخ احتياطي الآن." },
    { q: "كيف أغير سعر منتج؟", a: "من صفحة المنتجات، اضغط أيقونة التعديل على المنتج." },
  ];
  return (
    <div>
      <PageHeader title="المساعدة والدعم" sub="أهلًا! كيف نساعدك اليوم؟" actions={<Btn size="sm" icon={MessageSquare}>تواصل مع الدعم</Btn>} />
      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {guides.map((g, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center"><g.icon size={16} className="text-primary" /></div>
              <h3 className="font-semibold text-foreground">{g.title}</h3>
            </div>
            <ol className="space-y-2">
              {g.steps.map((s, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-secondary text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm mb-4">
        <h3 className="font-semibold text-foreground mb-3">أسئلة شائعة</h3>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <button className="w-full text-right px-5 py-3.5 flex items-center justify-between text-sm font-medium text-foreground cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setOpen(open === i ? null : i)}>
                {f.q}<ChevronDown size={14} className={`text-muted-foreground transition-transform flex-shrink-0 mr-2 ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <div className="px-5 pb-3.5 text-sm text-muted-foreground">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">محتاج مساعدة إضافية؟</p>
          <p className="text-sm text-muted-foreground">فريقنا متاح من 9 صباحًا حتى 10 مساءً</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm" icon={Phone}>اتصال</Btn>
          <Btn size="sm" icon={MessageSquare}>واتساب</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsPage() {
  const [tab, setTab] = useState("store");
  const tabs = [
    { id: "store", label: "معلومات المحل", icon: Store },
    { id: "tax", label: "الضرائب والدفع", icon: Percent },
    { id: "hardware", label: "الأجهزة", icon: Printer },
    { id: "backup", label: "النسخ الاحتياطي", icon: Download },
    { id: "security", label: "الأمان", icon: Lock },
  ];
  return (
    <div>
      <PageHeader title="الإعدادات" />
      <div className="flex gap-5">
        <div className="w-44 flex-shrink-0">
          <div className="bg-card rounded-xl border border-border p-2 shadow-sm space-y-0.5">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer
                  ${tab === t.id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <t.icon size={14} />{t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-card rounded-xl border border-border p-5 shadow-sm">
          {tab === "store" && (
            <div className="space-y-4 max-w-lg">
              <h3 className="font-bold text-foreground mb-4">معلومات المحل</h3>
              <Input label="اسم المحل" placeholder="ماركت المدينة" />
              <Input label="رقم الهاتف" placeholder="01xxxxxxxxx" />
              <Input label="العنوان" placeholder="شارع الملك فيصل، الجيزة" />
              <Input label="الرقم الضريبي" placeholder="اختياري" />
              <Btn icon={Check} onClick={() => toast.success("تم حفظ معلومات المحل")}>حفظ التغييرات</Btn>
            </div>
          )}
          {tab === "tax" && (
            <div className="space-y-4 max-w-lg">
              <h3 className="font-bold text-foreground mb-4">الضرائب وطرق الدفع</h3>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div><p className="font-medium text-foreground text-sm">تفعيل ضريبة القيمة المضافة</p><p className="text-xs text-muted-foreground">تضاف تلقائيًا على الفواتير</p></div>
                <div className="w-10 h-5 rounded-full bg-primary cursor-pointer relative"><div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" /></div>
              </div>
              <Input label="نسبة الضريبة %" placeholder="14" />
              <div>
                <p className="text-sm font-medium text-foreground mb-2">طرق الدفع المفعّلة</p>
                {["كاش", "كارت", "محفظة إلكترونية", "دفع مختلط"].map(m => (
                  <label key={m} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/30 mb-2 transition-colors">
                    <input type="checkbox" defaultChecked className="accent-primary" />
                    <span className="text-sm text-foreground">{m}</span>
                  </label>
                ))}
              </div>
              <Btn icon={Check} onClick={() => toast.success("تم حفظ إعدادات الضريبة")}>حفظ</Btn>
            </div>
          )}
          {tab === "hardware" && (
            <div className="space-y-3 max-w-lg">
              <h3 className="font-bold text-foreground mb-4">إعداد الأجهزة</h3>
              {[
                { name: "طابعة إيصالات", status: "متصل", icon: Printer, color: "green" },
                { name: "ماسح باركود", status: "متصل", icon: Hash, color: "green" },
                { name: "درج النقود", status: "غير متصل", icon: DollarSign, color: "gray" },
                { name: "طابعة باركود", status: "غير متصل", icon: Tag, color: "gray" },
                { name: "الميزان الإلكتروني", status: "قريبًا", icon: Cpu, color: "yellow" },
              ].map(h => (
                <div key={h.name} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-card rounded-xl flex items-center justify-center border border-border"><h.icon size={15} className="text-primary" /></div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{h.name}</p>
                      <p className="text-xs"><Badge label={h.status} color={h.color} /></p>
                    </div>
                  </div>
                  <Btn variant="outline" size="sm" disabled={h.status === "قريبًا"}>إعداد</Btn>
                </div>
              ))}
            </div>
          )}
          {tab === "security" && (
            <div className="space-y-4 max-w-lg">
              <h3 className="font-bold text-foreground mb-4">إعدادات الأمان</h3>
              <div className="p-4 rounded-xl border border-border space-y-3">
                <p className="font-medium text-foreground text-sm">تغيير كلمة المرور</p>
                <Input label="كلمة المرور الحالية" type="password" placeholder="••••••••" />
                <Input label="كلمة المرور الجديدة" type="password" placeholder="••••••••" />
                <Input label="تأكيد كلمة المرور" type="password" placeholder="••••••••" />
                <Btn size="sm">حفظ</Btn>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                <div><p className="font-medium text-foreground text-sm">تفعيل سجل النشاط</p><p className="text-xs text-muted-foreground">تتبع جميع العمليات</p></div>
                <div className="w-10 h-5 rounded-full bg-primary cursor-pointer relative"><div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" /></div>
              </div>
            </div>
          )}
          {tab === "backup" && (
            <EmptyState icon={Download} title="قريبًا" sub="إعدادات النسخ الاحتياطي تحت التطوير" />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Super Admin ──────────────────────────────────────────────────────────────
function SuperAdminPage() {
  const stores = [
    { name: "ماركت المدينة", plan: "Pro", status: "نشط", expires: "2024-07-31", users: 4, invoices: 1240 },
    { name: "سوبر ماركت الحي", plan: "أساسي", status: "نشط", expires: "2024-08-15", users: 2, invoices: 560 },
    { name: "مركز الغذاء", plan: "Business", status: "منتهي", expires: "2024-06-30", users: 8, invoices: 2800 },
    { name: "محل أبو علي", plan: "أساسي", status: "تجربة", expires: "2024-07-14", users: 1, invoices: 80 },
  ];
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center"><ShieldCheck size={18} className="text-violet-700" /></div>
        <div>
          <h1 className="text-xl font-bold text-foreground">لوحة المنصة</h1>
          <p className="text-sm text-muted-foreground">سوبر أدمن — إدارة جميع المحلات</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="إجمالي المحلات" value="24" icon={Store} iconBg="bg-teal-50 text-teal-700" />
        <KpiCard title="محلات نشطة" value="19" icon={CheckCircle} trend="up" trendVal="+3 هذا الشهر" iconBg="bg-emerald-50 text-emerald-700" />
        <KpiCard title="الإيرادات MRR" value="8,400 ج" icon={TrendingUp} trend="up" trendVal="+15%" iconBg="bg-blue-50 text-blue-700" />
        <KpiCard title="اشتراكات منتهية" value="3" icon={AlertCircle} iconBg="bg-red-50 text-red-600" />
      </div>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">المحلات المشتركة</h3>
          <Btn size="sm" icon={Plus}>إضافة محل</Btn>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 text-muted-foreground text-xs border-b border-border">
            {["اسم المحل", "الخطة", "الحالة", "تاريخ الانتهاء", "المستخدمون", "الفواتير", ""].map(h => (
              <th key={h} className="py-3 px-4 text-right font-medium">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {stores.map(s => (
              <tr key={s.name} className="border-t border-border hover:bg-muted/20">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">{s.name[0]}</div>
                    <span className="font-medium text-foreground">{s.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4"><Badge label={s.plan} color={s.plan === "Pro" ? "purple" : s.plan === "Business" ? "blue" : "gray"} /></td>
                <td className="py-3 px-4"><Badge label={s.status} color={s.status === "نشط" ? "green" : s.status === "تجربة" ? "yellow" : "red"} /></td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{s.expires}</td>
                <td className="py-3 px-4 text-muted-foreground">{s.users}</td>
                <td className="py-3 px-4 text-muted-foreground">{s.invoices.toLocaleString("ar-EG")}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"><Eye size={13} /></button>
                    <button className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground"><Edit2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell({ state, setState }: { state: AppState; setState: (s: AppState) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    applyThemePreference(state.darkMode);
  }, [state.darkMode]);

  const sidebarWidth = isMobile ? 0 : (collapsed ? 64 : 240);
  const navigate = (v: View) => {
    if (!ROLE_VIEWS[state.role].includes(v)) return;
    setState({ ...state, view: v });
    setSidebarOpen(false);
  };
  const toggleDark = () => setState({ ...state, darkMode: !state.darkMode });
  const onSaleComplete = (total: number) => setState({ ...state, invoiceCounter: state.invoiceCounter + 1 });

  const renderView = () => {
    switch (state.view) {
      case "dashboard": return <Dashboard onNav={navigate} />;
      case "pos": return <POSScreen invoiceNum={state.invoiceCounter} onSaleComplete={(t) => onSaleComplete(t)} />;
      case "shifts": return <ShiftsPage />;
      case "end-of-day": return <EndOfDayPage />;
      case "products": return <ProductsPage />;
      case "categories": return <CategoriesPage />;
      case "inventory": return <InventoryPage />;
      case "sales": return <SalesPage onNav={navigate} />;
      case "returns": return <ReturnsPage />;
      case "expenses": return <ExpensesPage />;
      case "reports": return <ReportsPage />;
      case "suppliers": return <SuppliersPage />;
      case "purchase-orders": return <PurchaseOrdersPage />;
      case "customers": return <CustomersPage />;
      case "notifications": return <NotificationsPage />;
      case "ai-insights": return <AIInsightsPage />;
      case "users": return <UsersPage />;
      case "activity-log": return <ActivityLogPage />;
      case "subscription": return <SubscriptionPage />;
      case "help": return <HelpPage />;
      case "settings": return <SettingsPage />;
      case "super-admin": return <SuperAdminPage />;
      default: return <Dashboard onNav={navigate} />;
    }
  };

  const isPOS = state.view === "pos";

  return (
    <div dir="rtl" className="min-h-screen bg-background" style={{ fontFamily: "'Noto Sans Arabic', 'Inter', sans-serif" }}>
      <Toaster position="bottom-left" richColors closeButton />
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar — inline on desktop, overlay on mobile */}
      <div className={isMobile ? `fixed top-0 right-0 h-full z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}` : ""}>
        <Sidebar
          current={state.view} onNav={navigate}
          collapsed={isMobile ? false : collapsed}
          onToggle={() => setCollapsed(c => !c)}
          onLogout={() => setState({ ...state, view: "login" })}
          role={state.role}
        />
      </div>
      {state.role === "superadmin" ? (
        <header
          className="fixed top-0 left-0 h-14 bg-card border-b border-border z-20 flex items-center px-5 gap-4"
          style={{ right: sidebarWidth }}
        >
          {isMobile && (
            <button onClick={() => setSidebarOpen(o => !o)} className="p-2 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground">
              <Menu size={18} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-violet-500" />
            <span className="font-bold text-foreground text-sm">لوحة تحكم المنصة</span>
            <span className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">سوبر أدمن</span>
          </div>
          <div className="mr-auto flex items-center gap-2">
            <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
              {state.darkMode ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} className="text-muted-foreground" />}
            </button>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-700 dark:text-violet-300 text-xs font-bold">
                {state.userName[0]}
              </div>
              <span className="text-sm font-medium text-foreground">{state.userName}</span>
              <button onClick={() => setState({ ...state, view: "login" })} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500 cursor-pointer transition-colors mr-1">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>
      ) : (
        <TopBar
          branch={state.currentBranch}
          onBranchChange={b => setState({ ...state, currentBranch: b })}
          isOnline={state.isOnline}
          userName={state.userName}
          onNav={navigate}
          sidebarWidth={sidebarWidth}
          darkMode={state.darkMode}
          onToggleDark={toggleDark}
          onMenuToggle={() => setSidebarOpen(o => !o)}
          isMobile={isMobile}
        />
      )}
      <main className="pt-14 transition-all duration-300" style={{ marginRight: sidebarWidth }}>
        <div className={isPOS ? "" : "p-6 max-w-7xl"}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useState<AppState>({
    view: "landing", role: "owner", isOnline: true,
    currentBranch: "الفرع الرئيسي", userName: "محمد ناصر",
    darkMode: getInitialDarkMode(),
    invoiceCounter: 896,
  });

  const navigate = (v: View) => setAppState(s => ({ ...s, view: v }));

  const handleLogin = (role: UserRole) => {
    const names: Record<UserRole, string> = {
      owner: "محمد ناصر", manager: "سارة خالد",
      cashier: "أحمد محمود", inventory: "محمود سامي", superadmin: "أدمن رصيد",
    };
    setAppState(s => ({ ...s, role, userName: names[role], view: ROLE_HOME[role] }));
  };

  if (appState.view === "landing") return <LandingPage onNav={navigate} />;
  if (appState.view === "login") return <LoginPage onNav={navigate} onLogin={handleLogin} />;
  if (appState.view === "register") return <RegisterPage onNav={navigate} />;
  if (appState.view === "onboarding") return <OnboardingWizard onDone={() => navigate("dashboard")} />;

  return <AppShell state={appState} setState={setAppState} />;
}
