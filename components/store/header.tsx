import { StoreHeaderClient } from "@/components/store/header-client";
import { getVisibleCategories } from "@/server/services/catalog";

export async function StoreHeader() {
  const categories = await getVisibleCategories();

  return <StoreHeaderClient categories={categories.map(({ id, name, slug }) => ({ id, name, slug }))} />;
}
