import Link from "next/link";
import { Link as IntlLink } from "@/i18n/routing";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 prose dark:prose-invert">
      <h1>Privacy</h1>
      <p>
        This demo marketplace processes orders through Stripe and stores account data in your database.
        For production, publish a privacy policy, data retention rules, and a process for GDPR access and
        deletion requests.
      </p>
      <p>
        While signed in, you may download a machine-readable export of your profile, orders, addresses,
        reviews, and wishlist:{" "}
        <Link href="/api/account/export" className="text-orange-600 hover:underline" prefetch={false}>
          /api/account/export
        </Link>
        .
      </p>
      <p>
        <IntlLink href="/" className="text-orange-600 hover:underline">
          Home
        </IntlLink>
      </p>
    </div>
  );
}

