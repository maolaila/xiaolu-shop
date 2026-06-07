import { expect, test, type Page } from "@playwright/test";

const pngFixtureBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

async function loginAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("账号").fill("admin");
  await page.getByLabel("密码").fill("admin123456");
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page.getByRole("heading", { name: "数据概览" })).toBeVisible();
}

async function dropFixtureImages(page: Page, selector: string, fileNames: string[]) {
  const bytes = Array.from(Buffer.from(pngFixtureBase64, "base64"));
  const dataTransfer = await page.evaluateHandle(
    ({ bytes: imageBytes, fileNames: names }) => {
      const transfer = new DataTransfer();
      for (const name of names) {
        transfer.items.add(new File([new Uint8Array(imageBytes)], name, { type: "image/png" }));
      }
      return transfer;
    },
    { bytes, fileNames }
  );

  await page.locator(selector).dispatchEvent("drop", { dataTransfer });
  await dataTransfer.dispose();
}

test("guest can browse products and is prompted to login for cart", async ({ page }) => {
  await page.goto("/");
  const searchInput = page.getByRole("searchbox", { name: "搜索商品" });
  await expect(searchInput).toBeVisible();
  await searchInput.fill("便携");
  await searchInput.press("Enter");
  await expect(page.getByRole("heading", { name: "搜索结果" })).toBeVisible();
  await expect(page.getByText("便携保温杯").first()).toBeVisible();
  await page.goBack();
  await expect(page.getByText("先下单，客服人工确认是否有货和付款方式")).toBeVisible();
  await page.getByRole("link", { name: "分类", exact: true }).click();
  await expect(page).toHaveURL(/\/products/);
  await expect(page.getByText("便携保温杯").first()).toBeVisible();
  await page.getByRole("link", { name: "便携保温杯" }).click();
  await expect(page).toHaveTitle(/便携保温杯/);
  await page.getByRole("button", { name: "加入购物车" }).click();
  await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
});

test("customer can register, add cart item and submit order", async ({ page }) => {
  const username = `buyer-${Date.now()}`;
  await page.goto("/register");
  await page.getByLabel("账号").fill(username);
  await page.getByLabel("密码", { exact: true }).fill("password123");
  await page.getByLabel("确认密码").fill("password123");
  await page.getByRole("button", { name: "注册并登录" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/products/portable-thermal-cup");
  await page.getByRole("button", { name: "加入购物车" }).click();
  await expect(page.getByText("已加入购物车")).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByText("便携保温杯")).toBeVisible();
  await page.getByRole("link", { name: "去结算" }).click();
  await page.getByLabel("收货人").fill("张三");
  await page.getByLabel("联系方式").fill("13800000000");
  await page.getByLabel("收货地址").fill("上海市测试路 1 号");
  await page.getByRole("button", { name: "提交订单" }).click();
  await expect(page.getByRole("heading", { name: /订单 LC/ })).toBeVisible();
  await expect(page.getByText("待确认").first()).toBeVisible();
});

test("admin can manage orders and customers", async ({ page }) => {
  await loginAdmin(page);

  await page.getByRole("link", { name: "订单管理" }).click();
  await expect(page.getByRole("heading", { name: "订单管理" })).toBeVisible();
  await page.getByRole("link", { name: "查看" }).first().click();
  await page.getByLabel("修改付款状态").selectOption("paid");
  await page.getByRole("button", { name: "保存付款" }).click();
  await expect(page.getByText("已付全款").first()).toBeVisible();

  await page.getByRole("link", { name: "顾客管理" }).click();
  await expect(page.getByRole("heading", { name: "顾客管理" })).toBeVisible();
  await expect(page.getByText("customer").first()).toBeVisible();
});

test("admin can manage income ledger records", async ({ page }) => {
  const suffix = Date.now();
  const customerName = `收入测试客户 ${suffix}`;

  await loginAdmin(page);

  await page.getByRole("link", { name: "收入账本" }).click();
  await expect(page.getByRole("heading", { name: "收入账本" })).toBeVisible();
  await page.locator('a[href="/admin/income/new"]').first().click();
  await expect(page.getByRole("heading", { name: "新增收入记录" })).toBeVisible();

  await page.getByLabel("客户姓名").fill(customerName);
  await page.getByLabel("电话/微信号").fill("wechat-income-test");
  await page.getByLabel("支付方式").fill("微信200");
  await page.getByLabel("商品").fill("久光贴10包，儿童无比滴1个");
  await page.getByLabel("价格/应收").fill("200");
  await page.getByLabel("收款/实收").fill("200");
  await page.getByLabel("备注").fill("亚马逊购入");
  await page.getByLabel("成本明细").fill("久光贴2400，无比滴650");
  await page.getByLabel("日元成本/合计").fill("3050");
  await page.getByLabel("人民币成本", { exact: true }).fill("80");
  await page.getByRole("button", { name: "保存记录" }).click();

  await expect(page).toHaveURL(/\/admin\/income$/);
  const row = page.getByRole("row").filter({ hasText: customerName });
  await expect(row).toBeVisible();
  await expect(row.getByText("¥120.00")).toBeVisible();

  await row.getByRole("link", { name: "编辑" }).click();
  await expect(page.getByRole("heading", { name: "编辑收入记录" })).toBeVisible();
  await page.getByLabel("利润").fill("118");
  await page.getByRole("button", { name: "保存记录" }).click();
  await expect(page.getByText("收入记录已保存")).toBeVisible();

  await page.getByRole("link", { name: "返回账本" }).click();
  await expect(page.getByRole("row").filter({ hasText: customerName }).getByText("¥118.00")).toBeVisible();
  await page.getByRole("row").filter({ hasText: customerName }).getByRole("link", { name: "编辑" }).click();
  await page.getByRole("button", { name: "删除记录" }).click();
  await expect(page).toHaveURL(/\/admin\/income$/);
  await expect(page.getByText(customerName)).toHaveCount(0);
});

test("admin can create a category and product that storefront search can find", async ({ page }) => {
  const suffix = Date.now();
  const categoryName = `自动测试分类 ${suffix}`;
  const productName = `自动测试商品 ${suffix}`;

  await loginAdmin(page);

  await page.goto("/admin/categories");
  await page.getByLabel("分类名称").fill(categoryName);
  await page.getByRole("button", { name: "新增分类" }).click();
  await expect(page.locator(`input[value="${categoryName}"]`)).toBeVisible();

  await page.goto("/admin/products/new");
  await expect(page.locator('input[type="file"]').nth(0)).toBeEnabled();
  await expect(page.locator('input[type="file"]').nth(1)).toBeEnabled();
  await page.waitForTimeout(300);
  await dropFixtureImages(page, '[data-testid="thumbnail-dropzone"]', [
    `product-thumb-${suffix}.png`,
    `ignored-extra-thumb-${suffix}.png`
  ]);
  await expect(page.getByText(/缩略图已生成 WebP/)).toBeVisible();
  await expect(page.locator('img[alt="商品缩略图"][src$="-thumb.webp"]').first()).toBeVisible();
  await expect(page.locator('input[name="mainImageUrl"]')).toHaveValue(/-thumb\.webp$/);
  await expect(page.locator('input[name="images"]')).toHaveValue("");
  await dropFixtureImages(page, '[data-testid="detail-dropzone"]', [
    `product-detail-1-${suffix}.png`,
    `product-detail-2-${suffix}.png`
  ]);
  await expect(page.getByText(/已上传 2 张详情图并转成 WebP/)).toBeVisible();
  await expect(page.locator('input[name="images"]')).toHaveValue(/\.webp\r?\n.*\.webp$/);
  await expect(page.getByText("详情图 1")).toBeVisible();
  await expect(page.getByText("详情图 2")).toBeVisible();
  await page.getByLabel("商品名称").fill(productName);
  await page.getByLabel("所属分类").selectOption({ label: categoryName });
  await page.getByLabel("商品状态").selectOption("active");
  await page.getByLabel("商品简介").fill("自动化创建商品，验证后台保存和前台搜索。");
  await page.getByLabel("价格").fill("12.5");
  await page.getByLabel("数量").fill("3");
  await page.getByLabel("详情文字").fill("<p>自动测试详情</p><script>alert('blocked')</script>");
  await page.getByRole("button", { name: "保存商品" }).click();
  await expect(page.getByRole("heading", { name: "编辑商品" })).toBeVisible();
  await expect(page.getByText(productName).first()).toBeVisible();

  await page.goto(`/search?q=${encodeURIComponent(productName)}`);
  await expect(page.getByText(productName).first()).toBeVisible();
  await page.locator('a[href^="/products/"]').filter({ hasText: productName }).click();
  await expect(page).toHaveURL(/\/products\/[^/?#]+$/);
  await expect(page.getByText("自动测试详情")).toBeVisible();
  await expect(page.locator("script", { hasText: "blocked" })).toHaveCount(0);
});

test("admin can update storefront settings and restore them", async ({ page }) => {
  const storeName = `Light Commerce ${Date.now()}`;

  await loginAdmin(page);
  await page.goto("/admin/settings");
  await page.getByLabel("店铺名称").fill(storeName);
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByText("站点配置已保存")).toBeVisible();

  await page.goto("/admin/settings");
  await expect(page.getByLabel("店铺名称")).toHaveValue(storeName);

  await page.goto("/admin/settings");
  await page.getByLabel("店铺名称").fill("Light Commerce");
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByText("站点配置已保存")).toBeVisible();
});

test("mobile storefront and admin layouts expose h5 navigation without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/");
  await expect(page.getByRole("searchbox", { name: "搜索商品" })).toBeVisible();
  await expect(page.getByRole("link", { name: "分类", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "购物车", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "我的订单", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "登录", exact: true })).toBeVisible();
  await expect(page.getByText("先下单，客服人工确认是否有货和付款方式")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await page.goto("/login");
  await expect(page.getByRole("link", { name: "登录", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "返回" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await loginAdmin(page);
  await expect(page.getByRole("link", { name: "商品管理" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "数据概览" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
