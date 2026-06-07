"use client";

import { useActionState, useMemo, useState, type DragEvent } from "react";
import { ImagePlus, Save, Trash2, Upload } from "lucide-react";

import { createProductAction, updateProductAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { emptyActionState } from "@/lib/action-state";
import type { CategoryRow, ProductDetail, ProductVariant } from "@/server/services/catalog";

type UploadResult = {
  url?: string;
  detailUrl?: string;
  thumbUrl?: string;
  error?: string;
  contentType?: string;
  originalBytes?: number;
  storedBytes?: number;
  thumbBytes?: number;
};

type EditableProductVariant = {
  id?: string;
  sku?: string | null;
  optionValues: Record<string, string>;
  price: number;
  costPrice: number | null;
  stock: number;
  status: "active" | "inactive";
};

const defaultVariant: EditableProductVariant[] = [
  {
    optionValues: {},
    price: 0,
    costPrice: null,
    stock: 0,
    status: "active"
  }
];

const imageActionClass =
  "inline-flex h-8 items-center justify-center gap-1 rounded-md border border-line bg-white px-2 text-xs font-medium text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45";
const imageDangerActionClass =
  "inline-flex h-8 items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45";
const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ProductForm({
  categories,
  product
}: {
  categories: CategoryRow[];
  product?: ProductDetail;
}) {
  const [state, action, pending] = useActionState(
    product ? updateProductAction : createProductAction,
    emptyActionState
  );
  const [mainImageUrl, setMainImageUrl] = useState(product?.mainImageUrl ?? "");
  const [detailImages, setDetailImages] = useState(() => (product?.images ?? []).map((image) => image.url));
  const [variantBaseList] = useState(() => toEditableVariants(product?.variants));
  const primaryVariantBase = variantBaseList[0] ?? defaultVariant[0];
  const [price, setPrice] = useState(() => formatNumberInput(primaryVariantBase.price));
  const [stock, setStock] = useState(() => String(primaryVariantBase.stock));
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [detailUploading, setDetailUploading] = useState(false);
  const [thumbnailUploadError, setThumbnailUploadError] = useState<string | null>(null);
  const [detailUploadError, setDetailUploadError] = useState<string | null>(null);
  const [thumbnailUploadInfo, setThumbnailUploadInfo] = useState<string | null>(null);
  const [detailUploadInfo, setDetailUploadInfo] = useState<string | null>(null);
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false);
  const [detailDragActive, setDetailDragActive] = useState(false);
  const [uploadedThumbs, setUploadedThumbs] = useState<Record<string, string>>({});
  const detailImagesValue = useMemo(() => detailImages.join("\n"), [detailImages]);
  const uploadDisabled = thumbnailUploading || detailUploading;
  const variantsJson = useMemo(
    () =>
      JSON.stringify([
        {
          id: primaryVariantBase.id,
          sku: primaryVariantBase.sku ?? null,
          optionValues: {},
          price: toNumber(price),
          costPrice: null,
          stock: toInteger(stock),
          status: "active"
        }
      ]),
    [price, primaryVariantBase.id, primaryVariantBase.sku, stock]
  );

  async function uploadOne(file: File, usage: "thumbnail" | "detail") {
    const data = new FormData();
    data.set("file", file);
    data.set("usage", usage);
    const response = await fetch("/api/admin/uploads/product-image", {
      method: "POST",
      body: data
    });
    const body = (await response.json()) as UploadResult;
    if (!response.ok || !body.url) {
      throw new Error(body.error ?? "上传失败");
    }
    return body;
  }

  async function uploadThumbnail(file: File | null, note?: string) {
    if (!file) {
      return;
    }
    setThumbnailUploading(true);
    setThumbnailUploadError(null);
    setThumbnailUploadInfo(null);
    try {
      const body = await uploadOne(file, "thumbnail");
      setMainImageUrl(body.thumbUrl ?? body.detailUrl ?? body.url ?? "");
      const successMessage =
        body.contentType === "image/webp"
          ? `缩略图已生成 WebP${body.thumbBytes ? `：${formatBytes(body.thumbBytes)}` : ""}`
          : "上传成功";
      setThumbnailUploadInfo(note ? `${successMessage}。${note}` : successMessage);
    } catch (error) {
      setThumbnailUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setThumbnailUploading(false);
    }
  }

  async function uploadDetailImages(files: FileList | File[] | null) {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }
    setDetailUploading(true);
    setDetailUploadError(null);
    setDetailUploadInfo(null);
    try {
      const uploaded: UploadResult[] = [];
      for (const file of selectedFiles) {
        uploaded.push(await uploadOne(file, "detail"));
      }
      const detailUrls = uploaded
        .map((body) => body.detailUrl ?? body.url)
        .filter((url): url is string => Boolean(url));
      setDetailImages((current) => appendDetailImageUrls(current, detailUrls));
      setUploadedThumbs((current) => toUploadedThumbMap(current, uploaded));
      const totalOriginalBytes = uploaded.reduce((sum, body) => sum + (body.originalBytes ?? 0), 0);
      const totalStoredBytes = uploaded.reduce((sum, body) => sum + (body.storedBytes ?? 0), 0);
      setDetailUploadInfo(
        `已上传 ${uploaded.length} 张详情图并转成 WebP${
          totalOriginalBytes > 0 && totalStoredBytes > 0
            ? `：原图 ${formatBytes(totalOriginalBytes)}，详情图 ${formatBytes(totalStoredBytes)}`
            : ""
        }`
      );
    } catch (error) {
      setDetailUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setDetailUploading(false);
    }
  }

  async function replaceDetailImage(index: number, file: File | null) {
    if (!file) {
      return;
    }
    setDetailUploading(true);
    setDetailUploadError(null);
    setDetailUploadInfo(null);
    try {
      const body = await uploadOne(file, "detail");
      const detailUrl = body.detailUrl ?? body.url;
      if (!detailUrl) {
        throw new Error("上传失败");
      }
      setDetailImages((current) => replaceDetailImageUrl(current, index, detailUrl));
      setUploadedThumbs((current) => toUploadedThumbMap(current, [body]));
      setDetailUploadInfo(`已更换第 ${index + 1} 张详情图`);
    } catch (error) {
      setDetailUploadError(error instanceof Error ? error.message : "上传失败");
    } finally {
      setDetailUploading(false);
    }
  }

  function removeDetailImage(index: number) {
    setDetailImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleThumbnailDrop(event: DragEvent<HTMLDivElement>) {
    stopDragEvent(event);
    setThumbnailDragActive(false);
    if (uploadDisabled) {
      return;
    }

    const files = getImageFiles(event.dataTransfer.files);
    if (files.length === 0) {
      setThumbnailUploadError("请拖入 jpg、png 或 webp 图片");
      setThumbnailUploadInfo(null);
      return;
    }

    void uploadThumbnail(files[0], files.length > 1 ? "缩略图只能上传 1 张，已使用第一张图片" : undefined);
  }

  function handleDetailDrop(event: DragEvent<HTMLDivElement>) {
    stopDragEvent(event);
    setDetailDragActive(false);
    if (uploadDisabled) {
      return;
    }

    const files = getImageFiles(event.dataTransfer.files);
    if (files.length === 0) {
      setDetailUploadError("请拖入 jpg、png 或 webp 图片");
      setDetailUploadInfo(null);
      return;
    }

    void uploadDetailImages(files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    stopDragEvent(event);
    if (!uploadDisabled) {
      event.dataTransfer.dropEffect = "copy";
    }
  }

  return (
    <form action={action} className="grid gap-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input name="slug" type="hidden" value={product?.slug ?? ""} />
      <input name="sku" type="hidden" value={product?.sku ?? ""} />
      <input name="tags" type="hidden" value={product?.tags.join(", ") ?? ""} />
      <input name="seoTitle" type="hidden" value={product?.seoTitle ?? ""} />
      <input name="seoDescription" type="hidden" value={product?.seoDescription ?? ""} />
      <input name="purchaseNote" type="hidden" value={product?.purchaseNote ?? ""} />
      <input name="mainImageUrl" type="hidden" value={mainImageUrl} />
      <input name="images" type="hidden" value={detailImagesValue} />
      <input name="variantsJson" type="hidden" value={variantsJson} />

      <section className="grid gap-4">
        <h2 className="text-base font-semibold text-ink">基础信息</h2>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_160px]">
          <Field label="商品名称">
            <Input name="name" defaultValue={product?.name ?? ""} maxLength={120} required />
          </Field>
          <Field label="所属分类">
            <Select name="categoryId" defaultValue={product?.categoryId ?? ""} required>
              <option value="">选择分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="商品状态">
            <Select name="status" defaultValue={product?.status ?? "draft"}>
              <option value="draft">草稿</option>
              <option value="active">上架</option>
              <option value="inactive">下架</option>
            </Select>
          </Field>
        </div>
        <Field label="商品简介">
          <Textarea className="min-h-24" name="summary" defaultValue={product?.summary ?? ""} maxLength={300} />
        </Field>
      </section>

      <section className="grid gap-4">
        <h2 className="text-base font-semibold text-ink">价格和数量</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="价格">
            <Input
              min="0"
              name="price"
              onChange={(event) => setPrice(event.target.value)}
              required
              step="0.01"
              type="number"
              value={price}
            />
          </Field>
          <Field label="数量">
            <Input
              min="0"
              name="stock"
              onChange={(event) => setStock(event.target.value)}
              required
              step="1"
              type="number"
              value={stock}
            />
          </Field>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">缩略图</h2>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {thumbnailUploading ? "上传中" : mainImageUrl ? "更换缩略图" : "上传缩略图"}
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploadDisabled}
              onChange={(event) => {
                void uploadThumbnail(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
        </div>
        {thumbnailUploadError ? <span className="text-xs font-normal text-red-600">{thumbnailUploadError}</span> : null}
        {thumbnailUploadInfo ? <span className="text-xs font-normal text-emerald-700">{thumbnailUploadInfo}</span> : null}
        <div
          aria-disabled={uploadDisabled}
          className={imageDropZoneClass(thumbnailDragActive, uploadDisabled)}
          data-testid="thumbnail-dropzone"
          onDragEnter={(event) => {
            stopDragEvent(event);
            if (!uploadDisabled) {
              setThumbnailDragActive(true);
            }
          }}
          onDragLeave={(event) => {
            stopDragEvent(event);
            setThumbnailDragActive(false);
          }}
          onDragOver={handleDragOver}
          onDrop={handleThumbnailDrop}
        >
          {mainImageUrl ? (
            <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center">
              <div className="overflow-hidden rounded-md border border-line bg-white">
                <div className="aspect-square bg-slate-100">
                  <img alt="商品缩略图" className="h-full w-full object-cover" src={mainImageUrl} />
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">拖拽图片到这里可替换缩略图</p>
                  <p className="mt-1 text-xs text-muted">缩略图只保留 1 张，拖入多张时使用第一张。</p>
                </div>
                <button className={`${imageDangerActionClass} w-fit`} onClick={() => setMainImageUrl("")} type="button">
                  <Trash2 className="h-3.5 w-3.5" />
                  删除
                </button>
              </div>
            </div>
          ) : (
            <div className="grid min-h-28 place-items-center text-center">
              <div>
                <Upload className="mx-auto h-7 w-7 text-muted" />
                <p className="mt-2 text-sm font-medium text-ink">拖拽 1 张图片到这里</p>
                <p className="mt-1 text-xs text-muted">也可以点击右上角上传缩略图</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">详情图片</h2>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium hover:bg-slate-50">
            <ImagePlus className="h-4 w-4" />
            {detailUploading ? "上传中" : "添加详情图"}
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={uploadDisabled}
              multiple
              onChange={(event) => {
                void uploadDetailImages(event.target.files);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
        </div>
        {detailUploadError ? <span className="text-xs font-normal text-red-600">{detailUploadError}</span> : null}
        {detailUploadInfo ? <span className="text-xs font-normal text-emerald-700">{detailUploadInfo}</span> : null}
        <div
          aria-disabled={uploadDisabled}
          className={imageDropZoneClass(detailDragActive, uploadDisabled)}
          data-testid="detail-dropzone"
          onDragEnter={(event) => {
            stopDragEvent(event);
            if (!uploadDisabled) {
              setDetailDragActive(true);
            }
          }}
          onDragLeave={(event) => {
            stopDragEvent(event);
            setDetailDragActive(false);
          }}
          onDragOver={handleDragOver}
          onDrop={handleDetailDrop}
        >
          {detailImages.length > 0 ? (
            <div className="grid gap-3">
              <p className="text-xs text-muted">拖拽图片到这里可继续追加详情图</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {detailImages.map((url, index) => {
                  const previewUrl = uploadedThumbs[url] ?? toGeneratedThumbnailUrl(url) ?? url;
                  return (
                    <figure className="overflow-hidden rounded-md border border-line bg-white" key={`${url}-${index}`}>
                      <div className="aspect-square bg-slate-100">
                        <img alt={`详情图 ${index + 1}`} className="h-full w-full object-cover" src={previewUrl} />
                      </div>
                      <figcaption className="grid gap-2 p-2 text-xs text-muted">
                        <span className="font-medium text-ink">详情图 {index + 1}</span>
                        <div className="grid grid-cols-2 gap-1">
                          <label className={`${imageActionClass} ${detailUploading ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}>
                            <Upload className="h-3.5 w-3.5" />
                            更换
                            <input
                              accept="image/png,image/jpeg,image/webp"
                              className="sr-only"
                              disabled={uploadDisabled}
                              onChange={(event) => {
                                void replaceDetailImage(index, event.target.files?.[0] ?? null);
                                event.target.value = "";
                              }}
                              type="file"
                            />
                          </label>
                          <button
                            className={imageDangerActionClass}
                            disabled={detailUploading}
                            onClick={() => removeDetailImage(index)}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            删除
                          </button>
                        </div>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid min-h-28 place-items-center text-center">
              <div>
                <ImagePlus className="mx-auto h-7 w-7 text-muted" />
                <p className="mt-2 text-sm font-medium text-ink">拖拽多张图片到这里</p>
                <p className="mt-1 text-xs text-muted">也可以点击右上角批量添加详情图</p>
              </div>
            </div>
          )}
        </div>
        {detailImages.length > 0 ? <div className="text-xs text-muted">详情图片数量：{detailImages.length}</div> : null}
      </section>

      <Field label="详情文字">
        <Textarea name="description" defaultValue={product?.description ?? ""} maxLength={5000} />
      </Field>

      {state.message ? (
        <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{state.message}</p>
      ) : null}
      <div>
        <Button disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "保存中" : "保存商品"}
        </Button>
      </div>
    </form>
  );
}

function imageDropZoneClass(active: boolean, disabled: boolean) {
  return [
    "rounded-md border border-dashed p-4 transition",
    active ? "border-brand bg-teal-50" : "border-line bg-white",
    disabled ? "opacity-60" : "hover:border-brand/60"
  ].join(" ");
}

function stopDragEvent(event: DragEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();
}

function getImageFiles(files: FileList) {
  return Array.from(files).filter((file) => supportedImageTypes.has(file.type));
}

function appendDetailImageUrls(images: string[], urls: string[]) {
  const next = [...images];
  const existing = new Set(next);
  for (const url of urls) {
    if (!existing.has(url)) {
      next.push(url);
      existing.add(url);
    }
  }
  return next;
}

function replaceDetailImageUrl(images: string[], index: number, url: string) {
  const next = images.filter((currentUrl, currentIndex) => currentIndex === index || currentUrl !== url);
  next[index] = url;
  return next.filter(Boolean);
}

function toUploadedThumbMap(current: Record<string, string>, uploaded: UploadResult[]) {
  const next = { ...current };
  for (const body of uploaded) {
    const detailUrl = body.detailUrl ?? body.url;
    if (detailUrl && body.thumbUrl) {
      next[detailUrl] = body.thumbUrl;
    }
  }
  return next;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function toGeneratedThumbnailUrl(url: string) {
  if (url.endsWith("/main.webp")) {
    return url.replace(/\/main\.webp$/, "/thumb.webp");
  }
  if (url.endsWith("-thumb.webp")) {
    return url;
  }
  return null;
}

function formatNumberInput(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toEditableVariants(variants: ProductVariant[] | undefined) {
  if (!variants || variants.length === 0) {
    return defaultVariant;
  }
  return variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    optionValues: variant.optionValues,
    price: Number(variant.price),
    costPrice: variant.costPrice == null ? null : Number(variant.costPrice),
    stock: variant.stock,
    status: variant.status
  }));
}
