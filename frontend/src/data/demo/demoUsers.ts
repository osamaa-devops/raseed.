import type { ActivityLog, RaseedNotification, User } from "../../types";

export const demoUsers: User[] = [
  { id: "u1", storeId: "store_city_market", branchId: "branch_main", name: "محمد ناصر", role: "owner", phone: "01001234563", status: "active" },
  { id: "u2", storeId: "store_city_market", branchId: "branch_main", name: "أحمد محمود", role: "cashier", phone: "01001234560", status: "active" },
  { id: "u3", storeId: "store_city_market", branchId: "branch_1", name: "سارة خالد", role: "inventory", phone: "01001234562", status: "active" },
];

export const demoNotifications: RaseedNotification[] = [
  { id: "n1", storeId: "store_city_market", title: "مخزون منخفض", body: "أرز مصري - متبقي 8 وحدات فقط", type: "warning", read: false, createdAt: "منذ ساعة" },
  { id: "n2", storeId: "store_city_market", title: "تم إغلاق الشيفت", body: "أحمد - إجمالي مبيعات 4,200 ج", type: "success", read: true, createdAt: "أمس" },
];

export const demoActivityLogs: ActivityLog[] = [
  { id: "a1", storeId: "store_city_market", userName: "أحمد", action: "إضافة منتج", entity: "products", createdAt: "10:32" },
  { id: "a2", storeId: "store_city_market", userName: "سارة", action: "تعديل مخزون", entity: "inventory", createdAt: "09:15" },
];
