import type { Store } from "../types";

const demoStoreNames = new Set(["ماركت المدينة", "City Market Demo"]);
const demoStoreIds = new Set(["demo-store-city-market", "store_city_market"]);

export function isDemoStore(store?: Pick<Store, "id" | "name"> | null) {
  if (!store) return false;
  return demoStoreIds.has(store.id) || demoStoreNames.has(store.name.trim());
}

export function isDevOrDemoEnvironment(store?: Pick<Store, "id" | "name"> | null) {
  return import.meta.env.DEV || isDemoStore(store);
}
