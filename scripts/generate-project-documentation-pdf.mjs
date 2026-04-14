import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const root = path.resolve(process.cwd());
const outPath = path.join(root, "PROJECT_DOCUMENTATION_DEVELOPER.pdf");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 54, bottom: 54, left: 54, right: 54 },
  info: {
    Title:
      "Marketplace E-commerce Website — Developer Documentation (lifecycle + screenshots)",
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

/**
 * Visual frame for a screenshot. Paste a real capture in a PDF editor over this area,
 * or print and attach. Keeps the doc self-contained without binary assets.
 */
function screenshotPlaceholder(title, caption) {
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const contentWidth = doc.page.width - marginLeft - marginRight;
  const boxHeight = 90;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + boxHeight + 42 > bottomLimit) {
    doc.addPage();
  }
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#333333").text(title);
  doc.moveDown(0.25);
  const x = marginLeft;
  const y = doc.y;
  doc.save();
  doc.rect(x, y, contentWidth, boxHeight).fill("#EFEFEF");
  doc.rect(x, y, contentWidth, boxHeight).strokeColor("#999999").lineWidth(0.5).dash(4, { space: 3 }).stroke();
  doc.restore();
  doc.font("Helvetica-Oblique").fontSize(9).fillColor("#555555");
  doc.text(
    "Screenshot area — capture this step from your screen and paste here (or overlay in a PDF editor).",
    x + 10,
    y + 34,
    { width: contentWidth - 20, align: "center" },
  );
  doc.y = y + boxHeight + 4;
  if (caption) {
    doc.font("Helvetica").fontSize(8.5).fillColor("#111111").text(caption, {
      width: contentWidth,
      lineGap: 1,
    });
  }
  doc.moveDown(0.5);
}

function lifecycleStep(n, text) {
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#111").text(`Step ${n}: ${text}`);
  doc.moveDown(0.15);
}

title("Marketplace E‑commerce Website — Developer Documentation");
p("Project: my-ecommerce-website");
p(
  "Stack: Next.js (App Router), NextAuth (credentials), Prisma (PostgreSQL), Stripe (Checkout + Connect + Webhooks), next-intl (i18n), Tailwind CSS + Radix UI",
);
p(
  "Audience: developer handover (implementation notes, lifecycle steps, screenshot frames, and how to demonstrate each feature).",
);

h1("1. What this project is");
p(
  "This is an Amazon-style marketplace web app with a product catalog, cart and checkout, customer accounts, seller onboarding with Stripe Connect, and an admin area for managing products, coupons, orders, and analytics.",
);

h1("2. Project lifecycle: planning → creating → developing → testing");
p(
  "This section walks through the project in four phases. After each step, capture a screenshot and place it in the dashed frame (or paste into the PDF in an editor). That gives you a complete visual record from idea to verified behavior.",
);

h2("2.1 Planning");
p(
  "Goal: agree on scope, data, payments, and roles before writing code. Deliverables: entity list, main user journeys, and environment checklist.",
);
lifecycleStep(
  1,
  "List actors (customer, seller, admin) and primary flows: browse → cart → checkout; seller Connect; admin catalog.",
);
screenshotPlaceholder(
  "Figure P1 — Planning artifact",
  "Example: whiteboard, Notion page, or simple diagram of user flows.",
);
lifecycleStep(
  2,
  "Sketch the data model: User, Seller, Product, Cart, Order, Coupon, Review, Subscription. Align with prisma/schema.prisma.",
);
screenshotPlaceholder(
  "Figure P2 — Schema / E‑R",
  "Screenshot of Prisma schema in the IDE, or Prisma Studio showing tables after seed.",
);
lifecycleStep(
  3,
  "Define payments: Stripe Checkout for one-time and subscription; webhook URL for /api/webhooks/stripe; test vs live keys.",
);
screenshotPlaceholder(
  "Figure P3 — Stripe + env plan",
  "Screenshot of .env.example or a checklist table (without real secret values).",
);
lifecycleStep(
  4,
  "Plan i18n: supported locales (e.g. en, fr) and URL shape /[locale]/….",
);
screenshotPlaceholder(
  "Figure P4 — Locale routing",
  "Screenshot of src/i18n/routing or the locale folder in the repo.",
);

h2("2.2 Creating (project setup)");
p(
  "Goal: runnable app on your machine with database and seeded data. Deliverables: dependencies installed, DB migrated, dev server up.",
);
lifecycleStep(1, "Install dependencies: npm install.");
screenshotPlaceholder(
  "Figure C1 — npm install",
  "Terminal showing successful npm install at project root.",
);
lifecycleStep(2, "Configure PostgreSQL and copy .env from .env.example; set DATABASE_URL.");
screenshotPlaceholder(
  "Figure C2 — Environment file",
  "Editor showing DATABASE_URL and placeholders (blur secrets if sharing).",
);
lifecycleStep(3, "Apply schema and seed: npm run db:push && npm run db:seed.");
screenshotPlaceholder(
  "Figure C3 — DB push and seed",
  "Terminal output ending with Seed OK or similar.",
);
lifecycleStep(4, "Start the app: npm run dev; open http://localhost:3000/en.");
screenshotPlaceholder(
  "Figure C4 — App running",
  "Browser showing the marketplace home or products page.",
);

h2("2.3 Developing");
p(
  "Goal: implement or extend features using App Router pages, route handlers under /api, and Prisma. Work in small slices: API → UI → webhook if needed.",
);
lifecycleStep(
  1,
  "Pick a feature (e.g. cart). Locate the route handler (e.g. src/app/api/cart/route.ts) and the UI (cart page + header).",
);
screenshotPlaceholder(
  "Figure D1 — Code navigation",
  "IDE showing API route + related page component side by side.",
);
lifecycleStep(
  2,
  "Run the dev server; use browser devtools Network tab to confirm API calls (POST /api/cart) return expected JSON.",
);
screenshotPlaceholder(
  "Figure D2 — Network tab",
  "DevTools Network entry for /api/cart with 200 response.",
);
lifecycleStep(
  3,
  "For Stripe flows, set STRIPE_SECRET_KEY; trigger Checkout and confirm redirect to Stripe-hosted page.",
);
screenshotPlaceholder(
  "Figure D3 — Stripe Checkout",
  "Browser on Stripe test Checkout page after redirect from your app.",
);

h2("2.4 Testing (verify behavior)");
p(
  "Goal: prove each feature works end-to-end. Combine manual UI tests, API checks, database inspection, and Stripe test mode.",
);
lifecycleStep(
  1,
  "Smoke test: register, login, browse products, add to cart (guest and logged-in), open wishlist and reviews.",
);
screenshotPlaceholder(
  "Figure T1 — Smoke test",
  "Any key screen showing success (e.g. cart with line items).",
);
lifecycleStep(
  2,
  "Checkout test: complete payment with Stripe test card 4242…; land on /en/checkout/success; see orders under account.",
);
screenshotPlaceholder(
  "Figure T2 — Order confirmation",
  "Checkout success page or account orders list.",
);
lifecycleStep(
  3,
  "Webhook test: use Stripe CLI (stripe listen --forward-to localhost:3000/api/webhooks/stripe) or deploy webhook URL; confirm order rows and stock in Prisma Studio.",
);
screenshotPlaceholder(
  "Figure T3 — Webhook or DB proof",
  "Stripe CLI output showing event received, or Prisma Studio Order table.",
);
lifecycleStep(
  4,
  "Role test: login as admin@example.com → /en/admin; as seller@example.com → /en/seller; confirm unauthorized users are redirected.",
);
screenshotPlaceholder(
  "Figure T4 — Admin or seller dashboard",
  "Protected area visible only with the correct role.",
);
p(
  "Repeat the same screenshot pattern for each feature in Section 5 when you document demos for stakeholders.",
);

divider();

h1("3. Quick start (local dev)");
p("This section is the fastest way to run the full stack locally for demos.");
p("Prereqs: Node.js, npm, PostgreSQL, and (optional) Stripe CLI for webhook forwarding.");
codeLine("npm install");
p("Create .env from .env.example, then run Prisma.");
codeLine("npm run db:push");
codeLine("npm run db:seed");
codeLine("npm run dev");
p("Optional database UI:");
codeLine("npm run db:studio");

h2("3.1 Seeded demo accounts");
p("The seed script creates demo users (password: demo1234):");
bullet("admin@example.com (ADMIN)");
bullet("customer@example.com (CUSTOMER)");
bullet("platform@example.com (SELLER, “Marketplace Official”)");
bullet("seller@example.com (SELLER, “Partner Goods Co”)");

divider();

h1("4. System overview (developer)")
h2("4.1 Routing + layouts")
p("The UI uses locale-prefixed routing under /[locale]/… with next-intl. Admin and Seller areas are protected at the layout level using server-side session checks and redirects to login with callbackUrl.")

h2("4.2 Authentication + roles")
p("Auth is NextAuth with a credentials provider (email/password). Passwords are stored as bcrypt hashes in User.passwordHash. Sessions use JWT strategy; user role is copied into the JWT and then into session.user.role.")

h2("4.3 Data layer")
p("Prisma models cover users/roles, sellers, products/categories/images, carts (guest + user), orders + order lines, reviews, wishlist, coupons/redemptions, subscriptions/entitlements, and StripeEvent for webhook idempotency.")

h2("4.4 Payments")
p("Stripe is used for one-time Checkout sessions and subscription Checkout sessions. A webhook handler finalizes paid checkouts, decrements stock, splits a single checkout into per-seller orders, records coupon redemption, clears cart, and syncs subscriptions + entitlements.")

divider();

h1("5. Features: implementation notes + how to demonstrate")

h2("5.1 Catalog browsing + product details")
p("What it is: A product catalog with detail pages keyed by slug. Products are stored in PostgreSQL (Prisma) with images and category + seller relations.")
p("Key pieces: UI routes /[locale]/products and /[locale]/products/[slug]; Product + ProductImage models; seeded products in prisma/seed.ts.")
h2("How to demonstrate")
demoSteps([
  "Run seed (npm run db:seed) so products exist.",
  "Open /en/products and confirm a product grid renders.",
  "Open a product detail page /en/products/<slug> and verify title/price/images render.",
  "Optional: confirm stock-related messaging by reducing Product.stock in Prisma Studio and refreshing the product/cart behavior.",
]);
screenshotPlaceholder(
  "Figure 5.1 — Catalog and product detail",
  "Paste a screenshot showing the product list and/or a product detail page after the steps above.",
);

divider();

h2("5.2 Search")
p("What it is: A search UI route that queries the catalog and displays results.")
p("Key pieces: /[locale]/search page and product listing logic.")
h2("How to demonstrate")
demoSteps([
  "Open /en/search.",
  "Search for a seeded keyword (e.g., 'Coffee' or 'Speaker').",
  "Verify results update and link into product details.",
]);
screenshotPlaceholder(
  "Figure 5.2 — Search results",
  "Paste a screenshot of the search page with results.",
);

divider();

h2("5.3 Register + login (NextAuth credentials)")
p("What it is: Customer registration via /api/auth/register and sign-in via NextAuth credentials provider. Roles are enforced across protected areas.")
p("Key pieces: /api/auth/register, /api/auth/[...nextauth], src/auth.ts callbacks (jwt/session role propagation).")
h2("How to demonstrate")
demoSteps([
  "Register a new account from /en/register and confirm success.",
  "Login from /en/login and verify session persists on refresh.",
  "Try to open /en/admin while logged in as a non-admin; confirm redirect to login/callback.",
  "Login as admin@example.com and confirm /en/admin is accessible.",
]);
screenshotPlaceholder(
  "Figure 5.3 — Auth and role protection",
  "Paste a screenshot of login success or admin dashboard after login.",
);

divider();

h2("5.4 Cart (guest + logged-in) + quantity updates")
p("What it is: A cart that works for guests (cookie session) and signed-in users (userId cart). Cart supports add, update quantity, remove (quantity 0), and clear.")
p("Key pieces: /api/cart POST/PATCH/DELETE; Cart + CartItem models; CART_COOKIE-based session cart id for guests.")
h2("How to demonstrate")
demoSteps([
  "As a guest (logged out), add a product to cart and open /en/cart.",
  "Change quantity and verify stock validation (try setting quantity beyond stock).",
  "Remove a line item (set quantity to 0) and verify it disappears.",
  "Login and add items; confirm the cart behaves for the logged-in user as well.",
]);
screenshotPlaceholder(
  "Figure 5.4 — Cart",
  "Paste a screenshot of /en/cart with line items.",
);

divider();

h2("5.5 Checkout (Stripe one-time payments) + success flow")
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
screenshotPlaceholder(
  "Figure 5.5 — Checkout + success",
  "Paste Stripe Checkout and/or checkout success and order history.",
);

divider();

h2("5.6 Coupons (validate + apply discount)")
p("What it is: Coupon validation endpoint calculates discount based on cart subtotal and coupon rules. Checkout uses computeCouponDiscount and creates a one-time Stripe coupon to apply discounts to the session.")
p("Key pieces: Coupon + CouponRedemption models; /api/coupon; /api/checkout discount metadata and optional Stripe coupons creation.")
h2("How to demonstrate")
demoSteps([
  "Login and add items so subtotal meets coupon minimum.",
  "Call /api/coupon?code=SAVE10 (via UI if present or browser) and verify ok response.",
  "Proceed to checkout with couponCode and verify reduced amount on Stripe Checkout.",
  "After payment, confirm a CouponRedemption record exists in the DB (Prisma Studio).",
]);
screenshotPlaceholder(
  "Figure 5.6 — Coupon applied",
  "Paste screenshot of discounted total on Stripe Checkout or coupon UI.",
);

divider();

h2("5.7 Wishlist")
p("What it is: Per-user wishlist items with add/remove and a check endpoint used to render UI state.")
p("Key pieces: WishlistItem model; /api/wishlist GET (onList), POST (add), DELETE (remove).")
h2("How to demonstrate")
demoSteps([
  "Login, open a product page, add it to wishlist.",
  "Open /en/wishlist and confirm the product appears.",
  "Remove it and verify it disappears; confirm /api/wishlist?productId=… returns onList false.",
]);
screenshotPlaceholder(
  "Figure 5.7 — Wishlist",
  "Paste screenshot of /en/wishlist with items.",
);

divider();

h2("5.8 Reviews (including verified purchase behavior)")
p("What it is: Users can create/update one review per product. Reviews are marked verifiedPurchase if the user has purchased the product in a paid/fulfilled lifecycle state.")
p("Key pieces: Review model unique(userId, productId); /api/reviews GET/POST; verified purchase check via OrderLine join.")
h2("How to demonstrate")
demoSteps([
  "As a logged-in user who has NOT purchased a product, submit a review; verify it saves.",
  "Purchase that product via checkout, then submit/update the review again.",
  "Verify verifiedPurchase becomes true (DB inspection via Prisma Studio).",
]);
screenshotPlaceholder(
  "Figure 5.8 — Reviews",
  "Paste screenshot of reviews on product page or review form.",
);

divider();

h2("5.9 Subscriptions (subscription checkout + webhook sync)")
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
screenshotPlaceholder(
  "Figure 5.9 — Subscription",
  "Paste Stripe subscription checkout or /en/subscriptions page.",
);

divider();

h2("5.10 Seller area (dashboard, products, orders)")
p("What it is: Seller pages for managing seller-related views: dashboard, products, and orders. Access is restricted to SELLER or ADMIN in the seller layout.")
p("Key pieces: /[locale]/seller/* pages; seller layout server-side role guard.")
h2("How to demonstrate")
demoSteps([
  "Login as seller@example.com and open /en/seller.",
  "Navigate to /en/seller/products and /en/seller/orders from the seller nav.",
  "Try to open /en/seller while logged out; confirm redirect to login.",
]);
screenshotPlaceholder(
  "Figure 5.10 — Seller area",
  "Paste screenshot of seller dashboard or orders.",
);

divider();

h2("5.11 Stripe Connect onboarding for sellers")
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
screenshotPlaceholder(
  "Figure 5.11 — Stripe Connect onboarding",
  "Paste Stripe Express onboarding or return URL after completion.",
);

divider();

h2("5.12 Admin area (products, coupons, orders, analytics)")
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
screenshotPlaceholder(
  "Figure 5.12 — Admin",
  "Paste screenshot of admin products list or orders.",
);

divider();

h2("5.13 Product image upload + Blob media streaming")
p("What it is: An authenticated endpoint accepts multipart uploads and stores images either locally (public/uploads) or in Vercel Blob (optional). If Blob is private, images can be streamed via /api/media/blob with pathname restrictions.")
p("Key pieces: /api/upload/product-image; /api/media/blob; storeProductImage implementation; BLOB_READ_WRITE_TOKEN and BLOB_ACCESS env vars.")
h2("How to demonstrate")
demoSteps([
  "Login as ADMIN or SELLER.",
  "Upload a product image via the product editor UI (or direct call to /api/upload/product-image).",
  "Verify returned URL is stored against ProductImage.url and renders on product page.",
  "If using private Blob, request /api/media/blob?pathname=products/... and confirm it streams with caching headers.",
]);
screenshotPlaceholder(
  "Figure 5.13 — Product image",
  "Paste product page showing uploaded image or upload UI.",
);

divider();

h2("5.14 Multi-language / locale routing (next-intl)")
p("What it is: Locale segment routing under /[locale]/… with server-side message loading. Only supported locales are allowed; others return notFound().")
p("Key pieces: src/app/[locale]/layout.tsx using next-intl; routing.locales gating.")
h2("How to demonstrate")
demoSteps([
  "Open /en/products and then /fr/products.",
  "Verify locale persists in navigation links (header/footer).",
  "Try an unsupported locale (e.g., /es/products) and confirm notFound behavior.",
]);
screenshotPlaceholder(
  "Figure 5.14 — Locales",
  "Paste two browser tabs or sequential screenshots of en vs fr.",
);

divider();

h2("5.15 Account export (download JSON)")
p("What it is: An authenticated endpoint that returns a JSON export of user data: user profile fields, orders+lines, addresses, reviews, and wishlist items.")
p("Key pieces: /api/account/export GET; data selection via Prisma queries; Content-Disposition header for download.")
h2("How to demonstrate")
demoSteps([
  "Login as a customer and place an order and/or create reviews/wishlist items.",
  "Call /api/account/export in the browser.",
  "Confirm the response downloads as export-<userId>.json and includes expected objects.",
]);
screenshotPlaceholder(
  "Figure 5.15 — Account export",
  "Paste browser download bar or JSON file opened in editor (redact if needed).",
);

h1("6. Main pages / routes (UI)");
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

h1("7. API endpoints (server routes)");
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

h1("8. Data model (Prisma / PostgreSQL)");
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

h1("9. Authentication and authorization");
p(
  "Authentication is handled by NextAuth using a credentials provider (email + password hash). Sessions are JWT-based. Role-based access is enforced in server layouts for /admin and /seller.",
);

h1("10. Payments and Stripe");
h2("10.1 One-time checkout");
p(
  "A logged-in user can create a Stripe Checkout session for cart items. The checkout payload includes shipping, optional tax estimation (when Stripe Tax is off), and optional coupons. If the cart contains items from a single seller with Stripe Connect configured, the payment intent includes an application fee and transfer destination.",
);
h2("10.2 Webhooks");
p(
  "Stripe webhooks finalize orders, decrement stock, split orders per seller, record coupon redemption, clear cart, and sync subscription lifecycle events.",
);

h1("11. Environment variables");
p("Create a .env file based on .env.example. Key variables:");
bullet("DATABASE_URL: PostgreSQL connection string");
bullet("NEXTAUTH_SECRET, NEXTAUTH_URL");
bullet("NEXT_PUBLIC_APP_URL: public base URL (used for Stripe redirects)");
bullet("STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
bullet("STRIPE_ENABLE_TAX, TAX_BPS (optional estimated tax)");
bullet("BLOB_READ_WRITE_TOKEN, BLOB_ACCESS (optional Vercel Blob)");

h1("12. Notes and constraints");
bullet("Currency amounts are stored as integers (cents) in the database and Stripe line items.");
bullet("Cart supports guest sessions via an HTTP-only cookie.");
bullet("Reviews are limited to one per user per product (upsert).");
bullet("Webhook handler uses a StripeEvent table for idempotency.");

doc.end();

console.log(`Wrote ${outPath}`);
