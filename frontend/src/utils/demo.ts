import type { Store } from "../types";

const starterStoreNames = new Set(["القاسم", "ماركت المدينة", "City Market Demo"]);
const starterStoreIds = new Set(["demo-store-city-market", "store_city_market"]);

export function isStarterStore(store?: Pick<Store, "id" | "name"> | null) {
  if (!store) return false;
  return starterStoreIds.has(store.id) || starterStoreNames.has(store.name.trim());
}

export function isLocalStoreContext(store?: Pick<Store, "id" | "name"> | null) {
  return import.meta.env.DEV || isStarterStore(store);
}
