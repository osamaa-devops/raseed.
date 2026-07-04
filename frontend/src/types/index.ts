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

export type Invoice = {
  id: Id;
  storeId: Id;
  branchId: Id;
  invoiceNumber: string;
  total: number;
  createdAt: string;
  cashierId?: Id;
  shiftId?: Id | null;
  customerId?: Id | null;
  customerName?: string;
  status: "PAID" | "VOID" | "REFUNDED" | "PARTIALLY_REFUNDED";
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  paidAmount: number;
  changeAmount: number;
  notes?: string | null;
  branch?: Branch;
  cashier?: { id: Id; name: string; email?: string | null };
  items?: InvoiceItem[];
  payments?: Payment[];
  returns?: Return[];
  updatedAt?: string;
};

export type InvoiceItem = {
  id: Id;
  storeId: Id;
  branchId: Id;
  invoiceId: Id;
  productId: Id;
  product?: Product;
  productName: string;
  productBarcode?: string | null;
  quantity: number;
  purchasePriceSnapshot?: number | null;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  returnedQuantity: number;
  returnableQuantity: number;
  createdAt: string;
};

export type Payment = {
  id: Id;
  storeId: Id;
  branchId: Id;
  invoiceId: Id;
  method: "CASH" | "CARD" | "WALLET";
  amount: number;
  createdAt: string;
};

export type CashierShift = {
  id: Id;
  storeId: Id;
  branchId: Id;
  cashierId: Id;
  branch?: Branch;
  cashier?: { id: Id; name: string; email?: string | null };
  openingCash: number;
  closingCash?: number | null;
  expectedCash?: number | null;
  actualCash?: number | null;
  difference?: number | null;
  status: "OPEN" | "CLOSED";
  openedAt: string;
  closedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HeldOrder = {
  id: Id;
  storeId: Id;
  branchId: Id;
  cashierId: Id;
  data: Record<string, unknown>;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSaleRequest = {
  branchId: Id;
  shiftId?: Id;
  items: Array<{ productId: Id; quantity: number; unitPrice?: number; discount?: number }>;
  payments: Array<{ method: Payment["method"]; amount: number }>;
  invoiceDiscount?: number;
  taxAmount?: number;
  notes?: string;
};

export type ReturnStatus = "COMPLETED" | "CANCELLED";

export type Return = {
  id: Id;
  storeId: Id;
  branchId: Id;
  invoiceId: Id;
  cashierId: Id;
  shiftId?: Id | null;
  returnNumber: string;
  reason: string;
  status: ReturnStatus;
  refundTotal: number;
  refundMethod: Payment["method"];
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  cashier?: { id: Id; name: string; email?: string | null };
  invoice?: Pick<Invoice, "id" | "invoiceNumber" | "status" | "total">;
  items: ReturnItem[];
};

export type ReturnItem = {
  id: Id;
  storeId: Id;
  branchId: Id;
  returnId: Id;
  invoiceItemId: Id;
  productId: Id;
  productName: string;
  productBarcode?: string | null;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  restocked: boolean;
  createdAt: string;
};

export type CreateReturnRequest = {
  branchId: Id;
  invoiceId: Id;
  shiftId?: Id;
  reason: string;
  refundMethod: Payment["method"];
  notes?: string;
  items: Array<{ invoiceItemId: Id; quantity: number; restocked?: boolean }>;
};

export type ExpenseCategory = "RENT" | "SALARIES" | "ELECTRICITY" | "MAINTENANCE" | "DELIVERY" | "SUPPLIES" | "OTHER";

export type Expense = {
  id: Id;
  storeId: Id;
  branchId: Id;
  userId: Id;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  notes?: string | null;
  attachmentUrl?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  user?: { id: Id; name: string; email?: string | null };
};

export type DailyClosing = {
  id: Id;
  storeId: Id;
  branchId: Id;
  closedById: Id;
  date: string;
  totalSales: number;
  totalReturns: number;
  totalExpenses: number;
  cashPayments: number;
  cardPayments: number;
  walletPayments: number;
  openingCash: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  netTotal: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  closedBy?: { id: Id; name: string; email?: string | null };
};

export type DashboardOverview = {
  date: string;
  todaySales: number;
  todayReturns: number;
  todayExpenses: number;
  netSales: number;
  grossProfitEstimate: number;
  netProfitEstimate: number;
  invoicesCount: number;
  returnsCount: number;
  averageInvoiceValue: number;
  lowStockCount: number;
  expiryAlertsCount: number;
  cashPayments: number;
  cardPayments: number;
  walletPayments: number;
  salesChangePercent: number;
  profitChangePercent: number;
  invoicesChangePercent: number;
  topSellingProducts: Array<{ productId: Id; productName: string; quantity: number; sales: number }>;
  recentInvoices: Array<{ id: Id; invoiceNumber: string; total: number; status: Invoice["status"]; cashier?: { id: Id; name: string }; createdAt: string }>;
  cashierPerformance: Array<{ cashierId: Id; cashierName: string; invoicesCount: number; totalSales: number }>;
};

export type ClosingSummary = {
  date: string;
  branchId: Id;
  totalSales: number;
  totalReturns: number;
  totalExpenses: number;
  cashPayments: number;
  cardPayments: number;
  walletPayments: number;
  openingCash: number;
  expectedCash: number;
  invoicesCount: number;
  returnsCount: number;
  netTotal: number;
  shifts: Array<Pick<CashierShift, "id" | "openingCash" | "expectedCash" | "actualCash" | "difference" | "status" | "openedAt" | "closedAt"> & { cashier?: { id: Id; name: string } }>;
  cashierSummaries: Array<{ cashierId: Id; cashierName: string; invoicesCount: number; totalSales: number }>;
  bestSellingProducts: Array<{ productId: Id; productName: string; quantity: number; sales: number }>;
  lowStockProducts: Array<{ productId: Id; productName: string; quantity: number; minStock: number }>;
};

export type ReportRange = { dateFrom: string; dateTo: string };

export type ReportResponse<T> = {
  range: ReportRange;
  rows: T[];
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
