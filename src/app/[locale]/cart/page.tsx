import Image from "next/image";
import { Link } from "@/i18n/routing";
import { auth } from "@/auth";
import { getCartForViewer } from "@/lib/cart";
import { formatMoney } from "@/lib/utils";
import CartLineControls from "@/components/cart-line-controls";
import ClearCartButton from "@/components/clear-cart-button";

export default async function CartPage() {
  const cart = await getCartForViewer();
  const session = await auth();

  if (!cart?.items.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Link href="/products" className="mt-4 inline-block text-orange-600 hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0,
  );
  const sellerName = cart.items[0].product.seller.shopName;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Cart</h1>
        <ClearCartButton />
      </div>
      <p className="mt-2 text-sm text-zinc-500">Seller: {sellerName}</p>
      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {cart.items.map((line) => {
          const img = line.product.images[0];
          return (
            <li key={line.id} className="flex flex-wrap gap-4 py-6">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {img ? (
                  <Image
                    src={img.url}
                    alt={img.alt ?? line.product.title}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="96px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${line.product.slug}`}
                  className="font-medium text-zinc-900 hover:text-orange-600 dark:text-zinc-100"
                >
                  {line.product.title}
                </Link>
                <p className="text-sm text-zinc-500">{formatMoney(line.product.price)} each</p>
                <CartLineControls lineId={line.id} quantity={line.quantity} />
              </div>
              <div className="text-right font-semibold">
                {formatMoney(line.product.price * line.quantity)}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 flex flex-col items-end gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="text-lg">
          Subtotal <span className="font-bold">{formatMoney(subtotal)}</span>
        </p>
        {session?.user ? (
          <Link
            href="/checkout"
            className="inline-flex rounded-lg bg-orange-600 px-6 py-2.5 font-medium text-white hover:bg-orange-700"
          >
            Checkout
          </Link>
        ) : (
          <p className="text-sm text-zinc-600">
            <Link href="/login" className="text-orange-600 hover:underline">
              Log in
            </Link>{" "}
            to checkout.
          </p>
        )}
      </div>
    </div>
  );
}
