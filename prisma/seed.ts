import {
  PrismaClient,
  Role,
  CouponType,
  SellerVerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Demo Customer",
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const platformUser = await prisma.user.upsert({
    where: { email: "platform@example.com" },
    update: {},
    create: {
      email: "platform@example.com",
      name: "Platform Store",
      passwordHash,
      role: Role.SELLER,
    },
  });

  const platformSeller = await prisma.seller.upsert({
    where: { userId: platformUser.id },
    update: {},
    create: {
      userId: platformUser.id,
      shopName: "Marketplace Official",
      slug: "marketplace-official",
      description: "Default storefront for seeded catalog items.",
      verificationStatus: SellerVerificationStatus.VERIFIED,
      commissionBps: 0,
    },
  });

  const secondSellerUser = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      email: "seller@example.com",
      name: "Partner Seller",
      passwordHash,
      role: Role.SELLER,
    },
  });

  const partnerSeller = await prisma.seller.upsert({
    where: { userId: secondSellerUser.id },
    update: {},
    create: {
      userId: secondSellerUser.id,
      shopName: "Partner Goods Co",
      slug: "partner-goods",
      description: "Second seller for marketplace demos.",
      verificationStatus: SellerVerificationStatus.VERIFIED,
      commissionBps: 1500,
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      description: "Devices and accessories",
    },
  });

  const home = await prisma.category.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      name: "Home",
      slug: "home",
      description: "Kitchen and living",
    },
  });

  const products = [
    {
      title: "Wireless Headphones",
      slug: "wireless-headphones",
      description:
        "Noise-cancelling over-ear headphones with 30-hour battery and USB-C charging.",
      price: 19900,
      compareAtPrice: 24900,
      stock: 120,
      sku: "WH-001",
      categoryId: electronics.id,
      sellerId: platformSeller.id,
    },
    {
      title: "Smart Speaker Mini",
      slug: "smart-speaker-mini",
      description: "Voice assistant with room-filling sound and privacy mute.",
      price: 4900,
      stock: 200,
      sku: "SS-002",
      categoryId: electronics.id,
      sellerId: platformSeller.id,
    },
    {
      title: "Stainless Kettle",
      slug: "stainless-kettle",
      description: "1.7L electric kettle with auto shut-off.",
      price: 3900,
      stock: 80,
      sku: "SK-101",
      categoryId: home.id,
      sellerId: partnerSeller.id,
    },
    {
      title: "Subscription Coffee Club",
      slug: "coffee-club-subscription",
      description: "Monthly curated beans — subscription eligible (Stripe price ID optional in env).",
      price: 2500,
      stock: 999,
      sku: "SUB-COFFEE",
      categoryId: home.id,
      sellerId: platformSeller.id,
      isSubscriptionEligible: true,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        stock: p.stock,
        sku: p.sku,
        categoryId: p.categoryId,
        sellerId: p.sellerId,
        isSubscriptionEligible: p.isSubscriptionEligible ?? false,
      },
      create: {
        ...p,
        compareAtPrice: p.compareAtPrice ?? null,
        isSubscriptionEligible: p.isSubscriptionEligible ?? false,
      },
    });
    const hasImage = await prisma.productImage.findFirst({
      where: { productId: product.id },
    });
    if (!hasImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `https://picsum.photos/seed/${product.slug}/800/800`,
          alt: product.title,
          position: 0,
        },
      });
    }
  }

  await prisma.coupon.upsert({
    where: { code: "SAVE10" },
    update: {},
    create: {
      code: "SAVE10",
      type: CouponType.PERCENT,
      value: 10,
      minSubtotal: 5000,
      maxRedemptions: 1000,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FLAT500" },
    update: {},
    create: {
      code: "FLAT500",
      type: CouponType.FIXED,
      value: 500,
      minSubtotal: 10000,
    },
  });

  console.log("Seed OK:", { admin: admin.email, customer: customer.email });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
