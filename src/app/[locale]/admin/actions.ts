"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { MutationResult } from "@/lib/action-result";
import { collectImageUrlsFromForm } from "@/lib/product-image-upload";
import { OrderStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

function slugify(input: string) {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

export async function adminCreateProduct(formData: FormData): Promise<MutationResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized", code: "unauthorized" };
  }
  const title = String(formData.get("title") ?? "").trim();
  const slugField = String(formData.get("slug") ?? "").trim();
  const slug = slugField || slugify(title);
  const description = String(formData.get("description") ?? "").trim();
  const price = Math.round(Number(formData.get("price") ?? 0) * 100);
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10);
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "");
  const sellerId = String(formData.get("sellerId") ?? "");
  const imageUrls = collectImageUrlsFromForm(formData);
  const isSubscriptionEligible = formData.get("isSubscriptionEligible") === "on";
  const stripePriceId = String(formData.get("stripePriceId") ?? "").trim() || null;

  if (!title || !description || !categoryId || !sellerId || price <= 0) {
    return { ok: false, error: "Missing required fields", code: "validation" };
  }

  try {
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        price,
        stock: Number.isFinite(stock) ? stock : 0,
        sku,
        categoryId,
        sellerId,
        isSubscriptionEligible,
        stripePriceId,
      },
    });

    let position = 0;
    for (const url of imageUrls) {
      await prisma.productImage.create({
        data: { productId: product.id, url, alt: title, position: position++ },
      });
    }

    revalidatePath("/en/products");
    revalidatePath("/fr/products");
    revalidatePath("/en/admin/products");
    revalidatePath("/fr/admin/products");
    return { ok: true, productId: product.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        error: "A product with this slug or SKU already exists.",
        code: "validation",
      };
    }
    return { ok: false, error: "Could not create product.", code: "validation" };
  }
}

export async function adminUpdateProduct(
  productId: string,
  formData: FormData,
): Promise<MutationResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized", code: "unauthorized" };
  }
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Math.round(Number(formData.get("price") ?? 0) * 100);
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10);
  const categoryId = String(formData.get("categoryId") ?? "");
  const sellerId = String(formData.get("sellerId") ?? "");
  const isSubscriptionEligible = formData.get("isSubscriptionEligible") === "on";
  const stripePriceId = String(formData.get("stripePriceId") ?? "").trim() || null;

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        slug,
        description,
        price,
        stock: Number.isFinite(stock) ? stock : 0,
        categoryId,
        sellerId,
        isSubscriptionEligible,
        stripePriceId,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        error: "Slug or SKU conflicts with another product.",
        code: "validation",
      };
    }
    return { ok: false, error: "Could not update product.", code: "validation" };
  }

  const newImageUrls = collectImageUrlsFromForm(formData);
  if (newImageUrls.length) {
    const maxPos = await prisma.productImage.aggregate({
      where: { productId },
      _max: { position: true },
    });
    let position = (maxPos._max.position ?? -1) + 1;
    for (const url of newImageUrls) {
      await prisma.productImage.create({
        data: { productId, url, alt: title, position: position++ },
      });
    }
  }

  revalidatePath("/en/products");
  revalidatePath("/fr/products");
  revalidatePath("/en/admin/products");
  revalidatePath("/fr/admin/products");
  revalidatePath(`/en/admin/products/${productId}`);
  revalidatePath(`/fr/admin/products/${productId}`);
  return { ok: true, productId };
}

export async function adminDeleteProduct(formData: FormData): Promise<MutationResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized", code: "unauthorized" };
  }
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { ok: false, error: "Missing product", code: "validation" };
  }

  const orderLines = await prisma.orderLine.count({ where: { productId } });
  if (orderLines > 0) {
    return {
      ok: false,
      error: "This product appears on past orders and cannot be deleted.",
      code: "has_orders",
    };
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch {
    return { ok: false, error: "Could not delete product.", code: "validation" };
  }

  revalidatePath("/en/products");
  revalidatePath("/fr/products");
  revalidatePath("/en/admin/products");
  revalidatePath("/fr/admin/products");
  revalidatePath("/en/seller/products");
  revalidatePath("/fr/seller/products");
  return { ok: true };
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<MutationResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized", code: "unauthorized" };
  }
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  } catch {
    return { ok: false, error: "Could not update order status.", code: "validation" };
  }
  revalidatePath("/en/admin/orders");
  revalidatePath("/fr/admin/orders");
  return { ok: true };
}

export async function adminCreateCoupon(formData: FormData): Promise<MutationResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { ok: false, error: "Unauthorized", code: "unauthorized" };
  }

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const type = String(formData.get("type") ?? "PERCENT");
  const value = parseInt(String(formData.get("value") ?? "0"), 10);
  const minSubtotalDollars = String(formData.get("minSubtotal") ?? "").trim();
  const maxRedemptionsStr = String(formData.get("maxRedemptions") ?? "").trim();
  const expiresAtStr = String(formData.get("expiresAt") ?? "").trim();

  if (!code || !/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return { ok: false, error: "Invalid code (use 3-32 chars: A-Z, 0-9, _ or -)", code: "validation" };
  }
  if (type !== "PERCENT" && type !== "FIXED") {
    return { ok: false, error: "Invalid coupon type", code: "validation" };
  }
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "Value must be greater than 0", code: "validation" };
  }
  if (type === "PERCENT" && value > 100) {
    return { ok: false, error: "Percent value cannot exceed 100", code: "validation" };
  }

  const minSubtotal =
    minSubtotalDollars !== ""
      ? Math.round(Number(minSubtotalDollars) * 100)
      : null;
  if (minSubtotal != null && (!Number.isFinite(minSubtotal) || minSubtotal < 0)) {
    return { ok: false, error: "Invalid min subtotal", code: "validation" };
  }

  const maxRedemptions =
    maxRedemptionsStr !== "" ? parseInt(maxRedemptionsStr, 10) : null;
  if (maxRedemptions != null && (!Number.isFinite(maxRedemptions) || maxRedemptions <= 0)) {
    return { ok: false, error: "Invalid max redemptions", code: "validation" };
  }

  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;
  if (expiresAtStr && Number.isNaN(expiresAt?.getTime())) {
    return { ok: false, error: "Invalid expiry date", code: "validation" };
  }

  try {
    await prisma.coupon.create({
      data: {
        code,
        type: type as "PERCENT" | "FIXED",
        value,
        minSubtotal,
        maxRedemptions,
        expiresAt,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Coupon code already exists.", code: "validation" };
    }
    return { ok: false, error: "Could not create coupon.", code: "validation" };
  }

  revalidatePath("/en/admin/coupons");
  revalidatePath("/fr/admin/coupons");
  return { ok: true };
}
