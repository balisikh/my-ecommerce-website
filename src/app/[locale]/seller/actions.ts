"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { MutationResult } from "@/lib/action-result";
import { collectImageUrlsFromForm } from "@/lib/product-image-upload";
import { Prisma } from "@prisma/client";

function slugify(input: string) {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

export async function sellerCreateProduct(formData: FormData): Promise<MutationResult> {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "SELLER" && session.user.role !== "ADMIN")) {
    return { ok: false, error: "Unauthorized", code: "unauthorized" };
  }
  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
  });
  if (!seller) {
    return { ok: false, error: "Seller profile required", code: "validation" };
  }

  const title = String(formData.get("title") ?? "").trim();
  const slugField = String(formData.get("slug") ?? "").trim();
  const slug = slugField || slugify(title);
  const description = String(formData.get("description") ?? "").trim();
  const price = Math.round(Number(formData.get("price") ?? 0) * 100);
  const stock = parseInt(String(formData.get("stock") ?? "0"), 10);
  const categoryId = String(formData.get("categoryId") ?? "");
  const imageUrls = collectImageUrlsFromForm(formData);

  if (!title || !description || !categoryId || price <= 0) {
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
        categoryId,
        sellerId: seller.id,
      },
    });

    let position = 0;
    for (const url of imageUrls) {
      await prisma.productImage.create({
        data: { productId: product.id, url, alt: title, position: position++ },
      });
    }

    revalidatePath("/en/seller/products");
    revalidatePath("/fr/seller/products");
    revalidatePath("/en/products");
    revalidatePath("/fr/products");
    return { ok: true, productId: product.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        error: "A product with this slug already exists.",
        code: "validation",
      };
    }
    return { ok: false, error: "Could not create product.", code: "validation" };
  }
}

export async function sellerDeleteProduct(formData: FormData): Promise<MutationResult> {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "SELLER" && session.user.role !== "ADMIN")) {
    return { ok: false, error: "Unauthorized", code: "unauthorized" };
  }
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { ok: false, error: "Missing product", code: "validation" };
  }

  const seller = await prisma.seller.findUnique({
    where: { userId: session.user.id },
  });
  if (!seller) {
    return { ok: false, error: "Seller profile not found", code: "validation" };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  });
  if (!product || product.sellerId !== seller.id) {
    return { ok: false, error: "You can only delete your own products.", code: "forbidden" };
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
  revalidatePath("/en/seller/products");
  revalidatePath("/fr/seller/products");
  return { ok: true };
}
