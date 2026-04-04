"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { MutationResult } from "@/lib/action-result";
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
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
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

    if (imageUrl) {
      await prisma.productImage.create({
        data: { productId: product.id, url: imageUrl, alt: title, position: 0 },
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
