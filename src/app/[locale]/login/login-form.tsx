"use client";

import { signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) ?? "en";
  const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Invalid email or password.");
      return;
    }
    toast.success("Signed in");
    window.location.href = callbackUrl.startsWith("/") ? callbackUrl : `/${locale}`;
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold">Log in</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Demo: admin@example.com / customer@example.com — password <code>demo1234</code>
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-500">
        No account?{" "}
        <Link href="/register" className="text-orange-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
