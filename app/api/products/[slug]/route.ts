import { getProductBySlug } from "@/server/services/catalog";
import { jsonError, jsonOk } from "@/server/http";

function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const product = await getProductBySlug(decodeSlug((await params).slug));
    if (!product) {
      return jsonOk({ error: "商品不存在" }, { status: 404 });
    }
    return jsonOk({ product });
  } catch (error) {
    return jsonError(error);
  }
}
