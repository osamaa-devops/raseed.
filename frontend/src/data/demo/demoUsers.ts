import type { ActivityLog, RaseedNotification, User } from "../../types";

export const demoUsers: User[] = [
  { id: "u1", storeId: "store_city_market", branchId: "branch_main", roleId: "owner", name: "محمود القاسم", phone: "01001234563", status: "ACTIVE" },
  { id: "u2", storeId: "store_city_market", branchId: "branch_main", roleId: "owner", name: "أحمد القاسم", phone: "01001234564", status: "ACTIVE" },
  { id: "u3", storeId: "store_city_market", branchId: "branch_main", roleId: "cashier", name: "أحمد محمود", phone: "01001234560", status: "ACTIVE" },
  { id: "u4", storeId: "store_city_market", branchId: "branch_main", roleId: "cashier", name: "محمود علي", phone: "01001234561", status: "ACTIVE" },
  { id: "u5", storeId: "store_city_market", branchId: "branch_1", roleId: "inventory", name: "سارة خالد", phone: "01001234562", status: "ACTIVE" },
];

export const demoNotifications: RaseedNotification[] = [
  { id: "n1", storeId: "store_city_market", title: "مخزون منخفض", body: "أرز مصري - متبقي 8 وحدات فقط", type: "warning", read: false, createdAt: "منذ ساعة" },
  { id: "n2", storeId: "store_city_market", title: "تم إغلاق الشيفت", body: "أحمد - إجمالي مبيعات 4,200 ج", type: "success", read: true, createdAt: "أمس" },
];

export const demoActivityLogs: ActivityLog[] = [
  { id: "a1", storeId: "store_city_market", user: { id: "u2", name: "أحمد" }, action: "إضافة منتج", entityType: "products", createdAt: "2026-07-08T10:32:00.000Z" },
  { id: "a2", storeId: "store_city_market", user: { id: "u3", name: "سارة" }, action: "تعديل مخزون", entityType: "inventory", createdAt: "2026-07-08T09:15:00.000Z" },
];
