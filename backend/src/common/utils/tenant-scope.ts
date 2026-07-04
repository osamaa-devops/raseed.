/**
 * Multi-tenant rule for Raseed:
 * every store-owned business record must be queried and mutated with storeId.
 * branchId is added when a workflow is branch-specific, such as POS shifts,
 * invoices, stock movements, and end-of-day closing.
 */
export type TenantScope = {
  storeId: string;
  branchId?: string;
};
