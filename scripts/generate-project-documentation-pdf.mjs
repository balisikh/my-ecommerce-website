import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const root = path.resolve(process.cwd());
const outPath = path.join(root, "PROJECT_DOCUMENTATION_DEVELOPER.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 54, bottom: 54, left: 54, right: 54 },
  info: {
    Title: "Marketplace E-commerce Website — Developer Documentation",
    Author: "my-ecommerce-website",
  },
});

doc.pipe(fs.createWriteStream(outPath));

function title(t) {
  doc.moveDown(0.2);
  doc.font("Helvetica-Bold").fontSize(20).text(t, { align: "center" });
  doc.moveDown(0.8);
}
function h1(t) {
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(14).text(t);
  doc.moveDown(0.3);
}
function h2(t) {
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(12).text(t);
  doc.moveDown(0.2);
}
function p(t) {
  doc.font("Helvetica").fontSize(10.5).text(t, { lineGap: 2 });
}
function bullet(t) {
  const indent = 18;
  doc.font("Helvetica").fontSize(10.5);
  doc.text("•", { continued: true });
  doc.text(` ${t}`, { indent, lineGap: 2 });
}
function codeLine(t) {
  const x = doc.x;
  const y = doc.y;
  const w = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pad = 6;
  doc.save();
  doc.rect(x, y, w, 18).fill("#F6F6F6");
  doc.restore();
  doc.font("Courier").fontSize(9.5).fillColor("#111").text(t, x + pad, y + 4);
  doc.moveDown(0.8);
}

function divider() {
  doc.moveDown(0.8);
  doc.save();
  doc.moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .lineWidth(0.5)
    .strokeColor("#DDDDDD")
    .stroke();
  doc.restore();
  doc.moveDown(0.8);
}

function demoSteps(steps) {
  for (const s of steps) bullet(s);
}

title("Marketplace E‑commerce Website — Developer Documentation");
p("Project: my-ecommerce-website");
p(
  "Stack: Next.js (App Router), NextAuth (credentials), Prisma (PostgreSQL), Stripe (Checkout + Connect + Webhooks), next-intl (i18n), Tailwind CSS + Radix UI",
);
p("Audience: developer handover (implementation notes + how to demonstrate each feature).");

h1("1. What this project is");
p(
  "This is an Amazon-style marketplace web app with a product catalog, cart and checkout, customer accounts, seller onboarding with Stripe Connect, and an admin area for managing products, coupons, orders, and analytics.",
);

h1("2. Quick start (local dev)");
p("This section is the fastest way to run the full stack locally for demos.");
p("Prereqs: Node.js, npm, PostgreSQL, and (optional) Stripe CLI for webhook forwarding.");
codeLine("npm install");
p("Create .env from .env.example, then run Prisma.");
codeLine("npm run db:push");
codeLine("npm run db:seed");
codeLine("npm run dev");
p("Optional database UI:");
codeLine("npm run db:studio");

h2("2.1 Seeded demo accounts");
p("The seed script creates demo users (password: demo1234):");
bullet("admin@example.com (ADMIN)");
bullet("customer@example.com (CUSTOMER)");
bullet("platform@example.com (SELLER, “Marketplace Official”)");
bullet("seller@example.com (SELLER, “Partner Goods Co”)");

divider();

h1("3. System overview (developer)")
h2("3.1 Routing + layouts")
p("The UI uses locale-prefixed routing under /[locale]/… with next-intl. Admin and Seller areas are protected at the layout level using server-side session checks and redirects to login with callbackUrl.")

h2("3.2 Authentication + roles")
p("Auth is NextAuth with a credentials provider (email/password). Passwords are stored as bcrypt hashes in User.passwordHash. Sessions use JWT strategy; user role is copied into the JWT and then into session.user.role.")

h2("3.3 Data layer")
p("Prisma models cover users/roles, sellers, products/categories/images, carts (guest + user), orders + order lines, reviews, wishlist, coupons/redemptions, subscriptions/entitlements, and StripeEvent for webhook idempotency.")

h2("3.4 Payments")
p("Stripe is used for one-time Checkout sessions and subscription Checkout sessions. A webhook handler finalizes paid checkouts, decrements stock, splits a single checkout into per-seller orders, records coupon redemption, clears cart, and syncs subscriptions + entitlements.")

divider();

h1("4. Features: implementation notes + how to demonstrate")

h2("4.1 Catalog browsing + product details")
p("What it is: A product catalog with detail pages keyed by slug. Products are stored in PostgreSQL (Prisma) with images and category + seller relations.")
p("Key pieces: UI routes /[locale]/products and /[locale]/products/[slug]; Product + ProductImage models; seeded products in prisma/seed.ts.")
h2("How to demonstrate")
demoSteps([
  "Run seed (npm run db:seed) so products exist.",
  "Open /en/products and confirm a product grid renders.",
  "Open a product detail page /en/products/<slug> and verify title/price/images render.",
  "Optional: confirm stock-related messaging by reducing Product.stock in Prisma Studio and refreshing the product/cart behavior.",
]);

divider();

h2("4.2 Search")
p("What it is: A search UI route that queries the catalog and displays results.")
p("Key pieces: /[locale]/search page and product listing logic.")
h2("How to demonstrate")
demoSteps([
  "Open /en/search.",
  "Search for a seeded keyword (e.g., 'Coffee' or 'Speaker').",
  "Verify results update and link into product details.",
]);

divider();

h2("4.3 Register + login (NextAuth credentials)")
p("What it is: Customer registration via /api/auth/register and sign-in via NextAuth credentials provider. Roles are enforced across protected areas.")
p("Key pieces: /api/auth/register, /api/auth/[...nextauth], src/auth.ts callbacks (jwt/session role propagation).")
h2("How to demonstrate")
demoSteps([
  "Register a new account from /en/register and confirm success.",
  "Login from /en/login and verify session persists on refresh.",
  "Try to open /en/admin while logged in as a non-admin; confirm redirect to login/callback.",
  "Login as admin@example.com and confirm /en/admin is accessible.",
]);

divider();

h2("4.4 Cart (guest + logged-in) + quantity updates")
p("What it is: A cart that works for guests (cookie session) and signed-in users (userId cart). Cart supports add, update quantity, remove (quantity 0), and clear.")
p("Key pieces: /api/cart POST/PATCH/DELETE; Cart + CartItem models; CART_COOKIE-based session cart id for guests.")
h2("How to demonstrate")
demoSteps([
  "As a guest (logged out), add a product to cart and open /en/cart.",
  "Change quantity and verify stock validation (try setting quantity beyond stock).",
  "Remove a line item (set quantity to 0) and verify it disappears.",
  "Login and add items; confirm the cart behaves for the logged-in user as well.",
]);

divider();

h2("4.5 Checkout (Stripe one-time payments) + success flow")
p("What it is: A server endpoint creates a Stripe Checkout session in payment mode for the logged-in user's cart. On completion, webhook fulfills the order, decrements stock, splits orders per seller, and clears the cart.")
p("Key pieces: /api/checkout (creates checkout session), /api/webhooks/stripe (checkout.session.completed), Order/OrderLine tables, StripeEvent idempotency table.")
h2("How to demonstrate")
demoSteps([
  "Set STRIPE_SECRET_KEY + NEXT_PUBLIC_APP_URL in .env.",
  "Login as customer@example.com and add 1–2 products to cart.",
  "Go to /en/checkout, enter an address, start checkout (redirect to Stripe).",
  "Complete payment using Stripe test card (e.g., 4242 4242 4242 4242).",
  "Verify redirect to /en/checkout/success and then check /en/account/orders for created orders.",
  "Verify cart is cleared and product stock decreased (Prisma Studio).",
]);

divider();

h2("4.6 Coupons (validate + apply discount)")
p("What it is: Coupon validation endpoint calculates discount based on cart subtotal and coupon rules. Checkout uses computeCouponDiscount and creates a one-time Stripe coupon to apply discounts to the session.")
p("Key pieces: Coupon + CouponRedemption models; /api/coupon; /api/checkout discount metadata and optional Stripe coupons creation.")
h2("How to demonstrate")
demoSteps([
  "Login and add items so subtotal meets coupon minimum.",
  "Call /api/coupon?code=SAVE10 (via UI if present or browser) and verify ok response.",
  "Proceed to checkout with couponCode and verify reduced amount on Stripe Checkout.",
  "After payment, confirm a CouponRedemption record exists in the DB (Prisma Studio).",
]);

divider();

h2("4.7 Wishlist")
p("What it is: Per-user wishlist items with add/remove and a check endpoint used to render UI state.")
p("Key pieces: WishlistItem model; /api/wishlist GET (onList), POST (add), DELETE (remove).")
h2("How to demonstrate")
demoSteps([
  "Login, open a product page, add it to wishlist.",
  "Open /en/wishlist and confirm the product appears.",
  "Remove it and verify it disappears; confirm /api/wishlist?productId=… returns onList false.",
]);

divider();

h2("4.8 Reviews (including verified purchase behavior)")
p("What it is: Users can create/update one review per product. Reviews are marked verifiedPurchase if the user has purchased the product in a paid/fulfilled lifecycle state.")
p("Key pieces: Review model unique(userId, productId); /api/reviews GET/POST; verified purchase check via OrderLine join.")
h2("How to demonstrate")
demoSteps([
  "As a logged-in user who has NOT purchased a product, submit a review; verify it saves.",
  "Purchase that product via checkout, then submit/update the review again.",
  "Verify verifiedPurchase becomes true (DB inspection via Prisma Studio).",
]);

divider();

h2("4.9 Subscriptions (subscription checkout + webhook sync)")
p("What it is: Subscription-eligible products can be purchased through Stripe Checkout subscription mode using a Stripe price id. Webhooks upsert Subscription rows and manage SubscriptionEntitlement (subscription_active).")
p("Key pieces: Product.isSubscriptionEligible + Product.stripePriceId; /api/checkout/subscription; webhook events customer.subscription.*; Subscription + SubscriptionEntitlement tables.")
h2("How to demonstrate")
demoSteps([
  "Create a recurring Stripe Price in your Stripe dashboard and set that id on a subscription-eligible product (Product.stripePriceId).",
  "Login and start subscription checkout from the product.",
  "Complete subscription in Stripe test mode.",
  "Verify Subscription row exists and entitlement key subscription_active is present for the user.",
  "Cancel the subscription in Stripe test dashboard and verify entitlement removal on webhook processing.",
]);

divider();

h2("4.10 Seller area (dashboard, products, orders)")
p("What it is: Seller pages for managing seller-related views: dashboard, products, and orders. Access is restricted to SELLER or ADMIN in the seller layout.")
p("Key pieces: /[locale]/seller/* pages; seller layout server-side role guard.")
h2("How to demonstrate")
demoSteps([
  "Login as seller@example.com and open /en/seller.",
  "Navigate to /en/seller/products and /en/seller/orders from the seller nav.",
  "Try to open /en/seller while logged out; confirm redirect to login.",
]);

divider();

h2("4.11 Stripe Connect onboarding for sellers")
p("What it is: Sellers can create or reuse a Stripe Express account and generate an onboarding link. The seller record stores stripeConnectAccountId. For single-seller checkouts, the platform can take an application fee and transfer funds to the connected account.")
p("Key pieces: /api/seller/connect; Seller.stripeConnectAccountId; checkout connect fee logic in /api/checkout for single-seller carts.")
h2("How to demonstrate")
demoSteps([
  "Set STRIPE_SECRET_KEY and run the app.",
  "Login as seller@example.com and open /en/seller/onboarding.",
  "Start onboarding (calls /api/seller/connect) and complete the Express flow in test mode.",
  "Confirm Seller.stripeConnectAccountId is stored in DB.",
  "Optional: put only that seller’s products into cart and complete checkout; verify transfer/application fee behavior in Stripe dashboard.",
]);

divider();

h2("4.12 Admin area (products, coupons, orders, analytics)")
p("What it is: Admin dashboard for operational control. Access is restricted to ADMIN at the admin layout level.")
p("Key pieces: /[locale]/admin/* pages; admin layout server-side role guard; product create/edit pages; coupon and order management pages.")
h2("How to demonstrate")
demoSteps([
  "Login as admin@example.com and open /en/admin.",
  "Open /en/admin/products and create a new product (/en/admin/products/new).",
  "Edit an existing product (/en/admin/products/<id>) and confirm changes persist.",
  "Open /en/admin/coupons and verify seeded coupons exist (SAVE10, FLAT500).",
  "Open /en/admin/orders after a checkout and confirm orders appear.",
]);

divider();

h2("4.13 Product image upload + Blob media streaming")
p("What it is: An authenticated endpoint accepts multipart uploads and stores images either locally (public/uploads) or in Vercel Blob (optional). If Blob is private, images can be streamed via /api/media/blob with pathname restrictions.")
p("Key pieces: /api/upload/product-image; /api/media/blob; storeProductImage implementation; BLOB_READ_WRITE_TOKEN and BLOB_ACCESS env vars.")
h2("How to demonstrate")
demoSteps([
  "Login as ADMIN or SELLER.",
  "Upload a product image via the product editor UI (or direct call to /api/upload/product-image).",
  "Verify returned URL is stored against ProductImage.url and renders on product page.",
  "If using private Blob, request /api/media/blob?pathname=products/... and confirm it streams with caching headers.",
]);

divider();

h2("4.14 Multi-language / locale routing (next-intl)")
p("What it is: Locale segment routing under /[locale]/… with server-side message loading. Only supported locales are allowed; others return notFound().")
p("Key pieces: src/app/[locale]/layout.tsx using next-intl; routing.locales gating.")
h2("How to demonstrate")
demoSteps([
  "Open /en/products and then /fr/products.",
  "Verify locale persists in navigation links (header/footer).",
  "Try an unsupported locale (e.g., /es/products) and confirm notFound behavior.",
]);

divider();

h2("4.15 Account export (download JSON)")
p("What it is: An authenticated endpoint that returns a JSON export of user data: user profile fields, orders+lines, addresses, reviews, and wishlist items.")
p("Key pieces: /api/account/export GET; data selection via Prisma queries; Content-Disposition header for download.")
h2("How to demonstrate")
demoSteps([
  "Login as a customer and place an order and/or create reviews/wishlist items.",
  "Call /api/account/export in the browser.",
  "Confirm the response downloads as export-<userId>.json and includes expected objects.",
]);

h1("3. Main pages / routes (UI)");
p("All UI routes below are under /[locale]/… (example: /en/products).");
bullet("Home: /[locale]/");
bullet("Products: /[locale]/products");
bullet("Product details: /[locale]/products/[slug]");
bullet("Search: /[locale]/search");
bullet("Cart: /[locale]/cart");
bullet("Checkout: /[locale]/checkout");
bullet("Checkout success: /[locale]/checkout/success");
bullet("Wishlist: /[locale]/wishlist");
bullet("Subscriptions: /[locale]/subscriptions");
bullet("Auth: /[locale]/login, /[locale]/register");
bullet("Account orders: /[locale]/account/orders");
bullet(
  "Seller: /[locale]/seller, /[locale]/seller/onboarding, /[locale]/seller/products, /[locale]/seller/orders",
);
bullet(
  "Admin: /[locale]/admin, /[locale]/admin/products, /[locale]/admin/products/new, /[locale]/admin/products/[id], /[locale]/admin/orders, /[locale]/admin/coupons, /[locale]/admin/analytics",
);
bullet("Policies: /[locale]/policies/privacy, /[locale]/policies/seller-terms");

h1("4. API endpoints (server routes)");
p("The app uses Next.js route handlers under /api/… .");
bullet("Auth: POST /api/auth/register, GET/POST /api/auth/[...nextauth]");
bullet("Cart: POST /api/cart, PATCH /api/cart, DELETE /api/cart");
bullet("Wishlist: GET/POST/DELETE /api/wishlist");
bullet("Reviews: GET/POST /api/reviews");
bullet("Coupons: GET /api/coupon?code=…");
bullet("Checkout (one-time purchase): POST /api/checkout");
bullet("Checkout (subscription): POST /api/checkout/subscription");
bullet("Stripe webhooks: POST /api/webhooks/stripe");
bullet("Seller onboarding: POST /api/seller/connect");
bullet("Upload product image: POST /api/upload/product-image");
bullet("Private Blob streaming: GET /api/media/blob?pathname=…");
bullet("Account export: GET /api/account/export");

h1("5. Data model (Prisma / PostgreSQL)");
p("Core entities:");
bullet("Users with roles: CUSTOMER, SELLER, ADMIN");
bullet("Sellers (shop profile + Stripe Connect account id + verification status)");
bullet("Products, categories, product images");
bullet("Cart + cart items (guest via sessionId, logged-in via userId)");
bullet(
  "Orders + order lines (orders are stored per-seller; checkout can split a single paid session into multiple seller orders)",
);
bullet("Reviews (one review per user+product), verifiedPurchase flag");
bullet("Wishlist items");
bullet("Coupons + redemptions");
bullet("Subscriptions + subscription entitlements (key: subscription_active)");
bullet("StripeEvent table for webhook idempotency");

h1("6. Authentication and authorization");
p(
  "Authentication is handled by NextAuth using a credentials provider (email + password hash). Sessions are JWT-based. Role-based access is enforced in server layouts for /admin and /seller.",
);

h1("7. Payments and Stripe");
h2("7.1 One-time checkout");
p(
  "A logged-in user can create a Stripe Checkout session for cart items. The checkout payload includes shipping, optional tax estimation (when Stripe Tax is off), and optional coupons. If the cart contains items from a single seller with Stripe Connect configured, the payment intent includes an application fee and transfer destination.",
);
h2("7.2 Webhooks");
p(
  "Stripe webhooks finalize orders, decrement stock, split orders per seller, record coupon redemption, clear cart, and sync subscription lifecycle events.",
);

h1("8. Environment variables");
p("Create a .env file based on .env.example. Key variables:");
bullet("DATABASE_URL: PostgreSQL connection string");
bullet("NEXTAUTH_SECRET, NEXTAUTH_URL");
bullet("NEXT_PUBLIC_APP_URL: public base URL (used for Stripe redirects)");
bullet("STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
bullet("STRIPE_ENABLE_TAX, TAX_BPS (optional estimated tax)");
bullet("BLOB_READ_WRITE_TOKEN, BLOB_ACCESS (optional Vercel Blob)");

h1("9. Notes and constraints");
bullet("Currency amounts are stored as integers (cents) in the database and Stripe line items.");
bullet("Cart supports guest sessions via an HTTP-only cookie.");
bullet("Reviews are limited to one per user per product (upsert).");
bullet("Webhook handler uses a StripeEvent table for idempotency.");

doc.end();

console.log(`Wrote ${outPath}`);
