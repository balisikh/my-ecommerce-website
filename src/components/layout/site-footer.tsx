import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-zinc-600 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Marketplace. {t("rights")}</p>
        <div className="flex gap-4">
          <Link href="/policies/privacy" className="hover:text-orange-600">
            {t("privacy")}
          </Link>
          <Link href="/policies/seller-terms" className="hover:text-orange-600">
            {t("sellerTerms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
