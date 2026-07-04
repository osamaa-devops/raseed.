export type Id = string;

export type Store = {
  id: Id;
  name: string;
  status: "active" | "trial" | "suspended";
};

export type Branch = {
  id: Id;
  storeId: Id;
  name: string;
  isDefault?: boolean;
};

export type UserRole = "owner" | "manager" | "cashier" | "inventory" | "superadmin";

export type User = {
  id: Id;
  storeId: Id;
  branchId?: Id;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  status: "active" | "invited" | "disabled";
};

export type Product = {
  id: Id;
  storeId: Id;
  name: string;
  barcode: string;
  categoryId: Id;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
};

export type Category = {
  id: Id;
  storeId: Id;
  name: string;
  color: string;
};

export type InventoryMovement = {
  id: Id;
  storeId: Id;
  branchId: Id;
  productId: Id;
  type: "in" | "out" | "adjustment" | "damage";
  quantity: number;
  createdAt: string;
};

export type Sale = {
  id: Id;
  storeId: Id;
  branchId: Id;
  invoiceNumber: string;
  total: number;
  paymentMethod: "cash" | "card" | "wallet";
  createdAt: string;
};

export type Invoice = Sale & {
  customerName?: string;
  status: "paid" | "returned" | "void";
};

export type Expense = {
  id: Id;
  storeId: Id;
  branchId?: Id;
  title: string;
  amount: number;
  category: string;
  date: string;
};

export type Supplier = {
  id: Id;
  storeId: Id;
  name: string;
  phone: string;
  balance: number;
};

export type Customer = {
  id: Id;
  storeId: Id;
  name: string;
  phone: string;
  debt: number;
  points: number;
};

export type Subscription = {
  id: Id;
  storeId: Id;
  planName: string;
  status: "trial" | "active" | "past_due" | "expired";
  endsAt?: string;
};

export type RaseedNotification = {
  id: Id;
  storeId: Id;
  title: string;
  body: string;
  type: "success" | "warning" | "danger" | "info";
  read: boolean;
  createdAt: string;
};

export type ActivityLog = {
  id: Id;
  storeId: Id;
  userName: string;
  action: string;
  entity?: string;
  createdAt: string;
};
