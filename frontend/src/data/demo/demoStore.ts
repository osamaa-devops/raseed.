import type { Branch, Store } from "../../types";

export const demoStore: Store = {
  id: "store_city_market",
  name: "ماركت المدينة",
  status: "TRIAL",
};

export const demoBranches: Branch[] = [
  { id: "branch_main", storeId: demoStore.id, name: "الفرع الرئيسي", isDefault: true },
  { id: "branch_1", storeId: demoStore.id, name: "فرع الحي الأول" },
];
