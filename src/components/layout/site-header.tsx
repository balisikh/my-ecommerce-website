import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { Link } from "@/i18n/routing";
import prisma from "@/lib/prisma";
import { CART_COOKIE } from "@/lib/cart";
import LocaleSwitcher from "@/components/locale-switcher";
import SearchForm from "@/components/search-form";
import SignOutButton from "@/components/sign-out-button";

export default async function SiteHeader() {
  const t = await getTranslations("nav");
  const session = await auth();
  let cartCount = 0;
  if (session?.user?.id) {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: true },
    });
    cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  } else {
    const sid = (await cookies()).get(CART_COOKIE)?.value;
    if (sid) {
      const cart = await prisma.cart.findUnique({
        where: { sessionId: sid },
        include: { items: true },
      });
      cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-orange-600">
          Marketplace
        </Link>
        <div className="order-last w-full md:order-none md:flex-1 md:max-w-xl">
          <SearchForm />
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <Link href="/products" className="text-zinc-700 hover:text-orange-600 dark:text-zinc-200">
            {t("products")}
          </Link>
          <Link href="/cart" className="text-zinc-700 hover:text-orange-600 dark:text-zinc-200">
            {t("cart")}
            {cartCount > 0 ? (
              <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                {cartCount}
              </span>
            ) : null}
          </Link>
          {session?.user ? (
            <>
              <Link href="/account/orders" className="text-zinc-700 hover:text-orange-600 dark:text-zinc-200">
                {t("orders")}
              </Link>
              <Link href="/wishlist" className="text-zinc-700 hover:text-orange-600 dark:text-zinc-200">
                {t("wishlist")}
              </Link>
              <Link href="/subscriptions" className="text-zinc-700 hover:text-orange-600 dark:text-zinc-200">
                {t("subscriptions")}
              </Link>
              {session.user.role === "ADMIN" ? (
                <Link href="/admin" className="text-zinc-700 hover:text-orange-600 dark:text-zinc-200">
                  {t("admin")}
                </Link>
              ) : null}
              {session.user.role === "SELLER" || session.user.role === "ADMIN" ? (
                <Link href="/seller" className="text-zinc-700 hover:text-orange-600 dark:text-zinc-200">
                  {t("seller")}
                </Link>
              ) : null}
              <span className="text-zinc-500 dark:text-zinc-400">{session.user.email}</span>
              <SignOutButton label={t("logout")} />
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-700 hover:text-orange-600 dark:text-zinc-200">
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-white hover:bg-orange-700"
              >
                {t("register")}
              </Link>
            </>
          )}
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
