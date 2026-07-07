export type Id = string;

export type StoreStatus = "ACTIVE" | "TRIAL" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "SUSPENDED" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
export type BillingCycle = "MONTHLY" | "YEARLY" | "TRIAL";
export type SubscriptionPlanStatus = "ACTIVE" | "INACTIVE";
export type SubscriptionPaymentMethod = "CASH" | "BANK_TRANSFER" | "WALLET" | "CARD" | "MANUAL";
export type SubscriptionPaymentStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";

export type Store = {
  id: Id;
  name: string;
  ownerName?: string | null;
  phone?: string | null;
  email?: string | null;
  status: StoreStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type DemoRequestStatus = "PENDING" | "CONTACTED" | "CONVERTED" | "REJECTED";

export type DemoRequest = {
  id: Id;
  storeName: string;
  ownerName: string;
  phone: string;
  email?: string | null;
  businessType: string;
  notes?: string | null;
  status: DemoRequestStatus;
  contactedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Branch = {
  id: Id;
  storeId: Id;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  isMain?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UserStatus = "ACTIVE" | "INACTIVE" | "INVITED" | "DISABLED";

export type User = {
  id: Id;
  storeId?: Id | null;
  branchId?: Id | null;
  roleId?: Id | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Permission = {
  id: Id;
  key: string;
  label: string;
  description?: string | null;
  createdAt?: string;
};

export type Role = {
  id: Id;
  storeId?: Id | null;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
  permissions?: Array<{ id: Id; roleId: Id; permissionId: Id; permission: Permission }>;
};

export type ActivityLog = {
  id: Id;
  storeId?: Id | null;
  branchId?: Id | null;
  userId?: Id | null;
  action: string;
  entityType?: string | null;
  entity?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: { id: Id; name: string; email?: string | null; phone?: string | null } | null;
  branch?: Pick<Branch, "id" | "name"> | null;
  store?: Pick<Store, "id" | "name"> | null;
};

export type ListResponse<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type Product = {
  id: Id;
  storeId: Id;
  categoryId?: Id | null;
  category?: Category | null;
  name: string;
  brand?: string | null;
  gender?: "MEN" | "WOMEN" | "UNISEX" | "KIDS";
  season?: "ALL_SEASON" | "SUMMER" | "WINTER" | "SPRING" | "AUTUMN";
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
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
};

export type ProductVariant = {
  id: Id;
  storeId: Id;
  productId: Id;
  product?: Product;
  size: string;
  color: string;
  sku?: string | null;
  barcode?: string | null;
  costPrice: number;
  sellingPrice: number;
  discountPrice?: number | null;
  stockQuantity: number;
  minStock: number;
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

export type InventoryTransferStatus = "COMPLETED" | "CANCELLED";

export type InventoryTransfer = {
  id: Id;
  storeId: Id;
  sourceBranchId: Id;
  destinationBranchId: Id;
  productId: Id;
  variantId?: Id | null;
  userId?: Id | null;
  quantity: number;
  status: InventoryTransferStatus;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  sourceBranch?: Branch;
  destinationBranch?: Branch;
  user?: { id: Id; name: string; email?: string | null } | null;
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
  customer?: { id: Id; name: string; phone: string } | null;
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
  method: "CASH" | "CARD" | "INSTAPAY" | "WALLET";
  amount: number;
  createdAt: string;
};

export type ReceiptPaperSize = "MM_58" | "MM_80" | "A4";
export type BarcodeLabelSize = "SMALL" | "MEDIUM" | "LARGE" | "CUSTOM";

export type ReceiptSettings = {
  id: Id;
  storeId: Id;
  branchId?: Id | null;
  storeName?: string | null;
  storePhone?: string | null;
  storeAddress?: string | null;
  logoUrl?: string | null;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  showLogo: boolean;
  showTaxNumber: boolean;
  taxNumber?: string | null;
  showCashierName: boolean;
  showBranchName: boolean;
  showCustomerInfo: boolean;
  paperSize: ReceiptPaperSize;
  createdAt: string;
  updatedAt: string;
};

export type BarcodeLabelSettings = {
  id: Id;
  storeId: Id;
  labelSize: BarcodeLabelSize;
  showProductName: boolean;
  showPrice: boolean;
  showBarcodeText: boolean;
  columns: number;
  rows?: number | null;
  marginTop?: number | null;
  marginRight?: number | null;
  marginBottom?: number | null;
  marginLeft?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ReceiptPayload = {
  store: Pick<Store, "id" | "name" | "phone"> & { address?: string | null; taxNumber?: string | null };
  branch: Branch & { phone?: string | null; address?: string | null };
  receiptSettings: ReceiptSettings;
  invoice: Pick<Invoice, "id" | "invoiceNumber" | "status" | "createdAt" | "subtotal" | "discountTotal" | "taxTotal" | "total" | "paidAmount" | "changeAmount" | "notes">;
  items: InvoiceItem[];
  payments: Payment[];
  customer?: Invoice["customer"];
  cashier?: Invoice["cashier"];
  totals: Pick<Invoice, "subtotal" | "discountTotal" | "taxTotal" | "total" | "paidAmount" | "changeAmount">;
  returnStatus?: Invoice["status"] | null;
  returns?: Return[];
  generatedAt: string;
};

export type BarcodeLabelProduct = {
  id: Id;
  name: string;
  barcode: string;
  sellingPrice: number;
  copies: number;
};

export type BarcodeLabelPayload = {
  settings: BarcodeLabelSettings;
  products: BarcodeLabelProduct[];
};

export type ExportFormat = "xlsx" | "csv";
export type ProductImportMode = "CREATE_ONLY" | "UPSERT";
export type StockImportMode = "ADD_TO_EXISTING" | "SET_INITIAL_QUANTITY";

export type ImportIssue = {
  row: number;
  field: string;
  message: string;
};

export type ImportPreviewResult = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createCount: number;
  updateCount: number;
  warnings: ImportIssue[];
  errors: ImportIssue[];
  sampleRows: unknown[];
};

export type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: ImportIssue[];
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
  customerId?: Id;
  items: Array<{ variantId: Id; productId?: Id; quantity: number; unitPrice?: number; discount?: number }>;
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
  totalCustomerDebt?: number;
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

export type SupplierStatus = "ACTIVE" | "INACTIVE";
export type SupplierPaymentMethod = "CASH" | "CARD" | "WALLET" | "BANK_TRANSFER";
export type SupplierTransactionType = "BALANCE_ADDED" | "PAYMENT_MADE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "PURCHASE_ORDER_RECEIVED";

export type Supplier = {
  id: Id;
  storeId: Id;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  status: SupplierStatus;
  currentBalance: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number; purchaseOrders: number };
};

export type SupplierTransaction = {
  id: Id;
  storeId: Id;
  branchId?: Id | null;
  supplierId: Id;
  purchaseOrderId?: Id | null;
  userId: Id;
  type: SupplierTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: SupplierPaymentMethod | null;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  branch?: Branch | null;
  user?: { id: Id; name: string; email?: string | null };
  purchaseOrder?: Pick<PurchaseOrder, "id" | "orderNumber" | "status" | "total"> | null;
};

export type PurchaseOrderStatus = "DRAFT" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export type PurchaseOrderItem = {
  id: Id;
  storeId: Id;
  branchId: Id;
  purchaseOrderId: Id;
  productId: Id;
  productName: string;
  productBarcode?: string | null;
  quantity: number;
  receivedQuantity: number;
  purchasePrice: number;
  lineTotal: number;
  expiryDate?: string | null;
  batchNumber?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrder = {
  id: Id;
  storeId: Id;
  branchId: Id;
  supplierId: Id;
  createdById: Id;
  orderNumber: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  expectedDeliveryDate?: string | null;
  receivedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  supplier?: Supplier;
  createdBy?: { id: Id; name: string; email?: string | null };
  items: PurchaseOrderItem[];
};

export type CreateSupplierRequest = Pick<Supplier, "name"> & Partial<Pick<Supplier, "phone" | "email" | "address" | "contactPerson" | "notes">>;
export type UpdateSupplierRequest = Partial<CreateSupplierRequest>;
export type SupplierPaymentRequest = { branchId?: Id; amount: number; paymentMethod: SupplierPaymentMethod; notes?: string };
export type SupplierAdjustRequest = { branchId?: Id; amount: number; direction: "IN" | "OUT"; reason: string; notes?: string };
export type CreatePurchaseOrderRequest = {
  branchId: Id;
  supplierId: Id;
  expectedDeliveryDate?: string;
  discountTotal?: number;
  taxTotal?: number;
  notes?: string;
  items: Array<{ productId: Id; quantity: number; purchasePrice: number; expiryDate?: string; batchNumber?: string }>;
};
export type UpdatePurchaseOrderRequest = Partial<CreatePurchaseOrderRequest>;
export type ReceivePurchaseOrderRequest = {
  paidAmount?: number;
  paymentMethod?: SupplierPaymentMethod;
  notes?: string;
  items: Array<{ purchaseOrderItemId: Id; receivedQuantity: number; expiryDate?: string; batchNumber?: string }>;
};

export type CustomerStatus = "ACTIVE" | "INACTIVE";

export type Customer = {
  id: Id;
  storeId: Id;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status: CustomerStatus;
  creditLimit?: number | null;
  currentDebt: number;
  loyaltyPoints: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { invoices: number; debtTransactions: number };
};

export type CustomerDebtTransactionType = "DEBT_ADDED" | "PAYMENT_RECEIVED" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";

export type CustomerDebtTransaction = {
  id: Id;
  storeId: Id;
  branchId?: Id | null;
  customerId: Id;
  invoiceId?: Id | null;
  userId: Id;
  type: CustomerDebtTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: Payment["method"] | null;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  branch?: Branch | null;
  user?: { id: Id; name: string; email?: string | null };
  invoice?: Pick<Invoice, "id" | "invoiceNumber" | "total" | "status"> | null;
};

export type CreateCustomerRequest = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  creditLimit?: number;
};

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export type AddDebtRequest = { branchId?: Id; amount: number; reason: string; notes?: string };
export type PayDebtRequest = { branchId?: Id; amount: number; paymentMethod: Payment["method"]; notes?: string };
export type AdjustDebtRequest = { branchId?: Id; amount: number; direction: "IN" | "OUT"; reason: string; notes?: string };

export type SubscriptionPlan = {
  id: Id;
  name: string;
  code: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly?: number | null;
  maxUsers: number;
  maxBranches: number;
  maxProducts: number;
  maxInvoicesPerMonth?: number | null;
  features?: Record<string, unknown> | null;
  status: SubscriptionPlanStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { subscriptions: number };
};

export type SubscriptionPayment = {
  id: Id;
  storeId: Id;
  subscriptionId: Id;
  amount: number;
  method: SubscriptionPaymentMethod;
  status: SubscriptionPaymentStatus;
  paidAt?: string | null;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  store?: Store;
  subscription?: Subscription;
};

export type Subscription = {
  id: Id;
  storeId: Id;
  planId: Id;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string | null;
  trialEndsAt?: string | null;
  billingCycle: BillingCycle;
  amount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
  store?: Store;
  payments?: SubscriptionPayment[];
};

export type StoreUsage = {
  usersCount: number;
  branchesCount: number;
  productsCount: number;
  invoicesThisMonth: number;
  storage?: number | null;
  limits: {
    maxUsers: number;
    maxBranches: number;
    maxProducts: number;
    maxInvoicesPerMonth?: number | null;
  } | null;
};

export type AdminOverview = {
  totalStores: number;
  activeStores: number;
  trialStores: number;
  expiredStores: number;
  suspendedStores: number;
  monthlyRecurringRevenue: number;
  yearlyRecurringRevenue: number;
  expiringSoonSubscriptions: number;
  recentStores: Store[];
  recentPayments: SubscriptionPayment[];
};

export type AdminStoreListItem = Store & {
  currentSubscription: Subscription | null;
  usage: StoreUsage;
};

export type AdminStoreDetails = Store & {
  branches: Branch[];
  currentSubscription: Subscription | null;
  usersSummary: { total: number; byRole: Record<string, number> };
  usage: StoreUsage;
  recentActivity: Array<{ id: Id; action: string; createdAt: string; metadata?: Record<string, unknown> | null }>;
  recentPayments: SubscriptionPayment[];
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

export type LicenseStatus = {
  developmentBypass: boolean;
  activated: boolean;
  valid: boolean;
  fingerprint: string;
  activatedAt?: string | null;
  storeName?: string | null;
  message: string;
};

export type BackupStatus = {
  backupDir: string;
  lastBackupAt: string | null;
  lastBackupPath: string | null;
};
