import { ProductForm } from "@/components/admin/product-form";
import { getAdminCategories } from "@/server/services/catalog";

export default async function NewProductPage() {
  const categories = await getAdminCategories();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">新增商品</h1>
        <p className="mt-1 text-sm text-muted">填写名称、分类、价格、数量和图片即可保存。</p>
      </div>
      <section className="rounded-md border border-line bg-white p-5">
        <ProductForm categories={categories} />
      </section>
    </div>
  );
}
