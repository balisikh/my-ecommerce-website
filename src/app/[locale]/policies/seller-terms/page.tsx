export default function SellerTermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 prose dark:prose-invert">
      <h1>Seller terms</h1>
      <p>
        Sellers receive payouts via Stripe Connect. Platform commission is configured per seller
        (basis points on eligible orders). Sellers must comply with applicable laws, accurate listings,
        and fulfillment SLAs. Disputes may be handled manually until automated workflows are added.
      </p>
    </div>
  );
}
