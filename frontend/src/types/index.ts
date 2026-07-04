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
  categoryId?: Id | null;
  category?: Category | null;
  name: string;
  barcode?: string | null;
  sku?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  profitMargin: number;
  unitType: string;
  minStock: number;
  expiryDate?: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: Id;
  storeId: Id;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
};

export type InventoryMovement = {
  id: Id;
  storeId: Id;
  branchId: Id;
  productId: Id;
  product?: Product;
  branch?: Branch;
  user?: { id: Id; name: string; email?: string | null } | null;
  type:
    | "INITIAL"
    | "ADD_STOCK"
    | "REMOVE_STOCK"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT"
    | "DAMAGE"
    | "EXPIRED"
    | "RETURN"
    | "SALE"
    | "PURCHASE"
    | "TRANSFER_IN"
    | "TRANSFER_OUT";
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type InventoryStock = {
  id: Id;
  storeId: Id;
  branchId: Id;
  productId: Id;
  product: Product;
  category?: Category | null;
  branch: Branch;
  quantity: number;
  minStock: number;
  minStockOverride?: number | null;
  stockStatus: "low_stock" | "in_stock" | "out_of_stock";
  lastMovementAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryBatch = {
  id: Id;
  storeId: Id;
  branchId: Id;
  productId: Id;
  product: Product;
  branch: Branch;
  batchNumber?: string | null;
  quantity: number;
  remainingQuantity: number;
  purchasePrice?: number | null;
  expiryDate?: string | null;
  receivedAt: string;
  daysRemaining?: number | null;
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
