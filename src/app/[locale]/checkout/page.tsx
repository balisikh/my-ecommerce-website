import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCartForViewer } from "@/lib/cart";
import CheckoutForm from "@/components/checkout-form";
import { formatMoney } from "@/lib/utils";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/checkout`);
  }
  const cart = await getCartForViewer();
  if (!cart?.items.length) {
    redirect(`/${locale}/cart`);
  }
  const subtotal = cart.items.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-300">
        Subtotal: <strong>{formatMoney(subtotal)}</strong> — shipping & tax finalized in Stripe.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
